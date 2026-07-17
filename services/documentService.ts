import { FormData as AppFormData, Partner, Titular } from '../types';
import { storage, db, auth } from './firebase';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// --- Presupuestos de tiempo del envío ---
// Ninguna operación de red del envío puede quedarse colgada indefinidamente:
// cada subida cancela si no reporta progreso (estancamiento) o excede el tope
// por intento, con reintentos ante fallo transitorio; el POST final aborta por
// AbortController. En móvil con señal débil, uploadBytes podía no resolver ni
// rechazar jamás — el spinner "Finalizando..." eterno y el expediente perdido.
const UPLOAD_STALL_MS = 30_000;      // sin progreso durante 30s → cancelar
const UPLOAD_ATTEMPT_CAP_MS = 120_000; // tope absoluto por intento de subida
const UPLOAD_MAX_ATTEMPTS = 3;       // 1 intento + 2 reintentos
const UPLOAD_RETRY_BASE_MS = 1_000;
const SUBMIT_FETCH_TIMEOUT_MS = 30_000;
const AUTH_TIMEOUT_MS = 15_000;

type Uploadable = File | string | null | undefined;

interface SerializedPartner extends Omit<Partner, 'idFront' | 'idBack'> {
    idFront: string | null;
    idBack: string | null;
}

interface SerializedTitular extends Omit<Titular, 'idFront' | 'idBack'> {
    idFront: string | null;
    idBack: string | null;
}

type SerializedForm = Omit<AppFormData,
    'logoFile' | 'onapiCertificate' | 'paymentReceipt' | 'partners' | 'titulars'
> & {
    logoFile: string | null;
    onapiCertificate: string | null;
    paymentReceipt: string | null;
    partners: SerializedPartner[];
    titulars: SerializedTitular[];
};

const isBrowserFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File;

// Garantiza una sesión (anónima si el cliente es invitado) ANTES de subir:
// las reglas de Storage exigen usuario autenticado para escribir. Si la auth
// anónima fallara, se intenta subir igual (el error real lo daría Storage).
const ensureUploadAuth = async (): Promise<void> => {
    if (auth.currentUser) return;
    try {
        await Promise.race([
            signInAnonymously(auth),
            new Promise((_, reject) => setTimeout(
                () => reject(new Error('Tiempo de espera agotado en auth anónima.')), AUTH_TIMEOUT_MS
            ))
        ]);
    } catch (e) {
        console.warn('Auth anónima no disponible; se intenta subir igual:', e);
    }
};

// Un intento de subida cancelable. uploadBytesResumable permite .cancel(),
// así que un detector de estancamiento (sin eventos de progreso durante
// UPLOAD_STALL_MS) o el tope absoluto del intento SIEMPRE liberan la promesa.
// El timer de estancamiento se rearma con cada progreso: un archivo grande en
// conexión lenta pero viva no falla por lento, solo por muerto.
const uploadOnce = (file: File, fullPath: string): Promise<string> =>
    new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(ref(storage, fullPath), file);
        let stallTimer: ReturnType<typeof setTimeout> | undefined;
        const capTimer = setTimeout(() => {
            task.cancel();
            reject(new Error('La subida excedió el tiempo máximo.'));
        }, UPLOAD_ATTEMPT_CAP_MS);
        const armStallTimer = () => {
            clearTimeout(stallTimer);
            stallTimer = setTimeout(() => {
                task.cancel();
                reject(new Error('La subida se quedó sin progreso (conexión estancada).'));
            }, UPLOAD_STALL_MS);
        };
        const cleanup = () => {
            clearTimeout(stallTimer);
            clearTimeout(capTimer);
        };
        armStallTimer();
        task.on(
            'state_changed',
            armStallTimer,
            (error) => { cleanup(); reject(error); },
            () => { cleanup(); resolve(task.snapshot.ref.fullPath); }
        );
    });

// Sube el archivo y devuelve su RUTA en Storage (no la URL de descarga).
// Generar la URL con getDownloadURL() requiere permiso de LECTURA, que desde
// el endurecimiento de seguridad solo se concede a usuarios autenticados; un
// cliente invitado obtendría 403 y se rompería el cierre del expediente.
// La escritura sigue abierta, así que la subida funciona; el servidor
// (Admin SDK, ignora las reglas) convierte esta ruta en una URL descargable.
const uploadFileAndGetPath = async (file: File, folder: string): Promise<string> => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    let lastError: unknown;
    for (let intento = 1; intento <= UPLOAD_MAX_ATTEMPTS; intento++) {
        // Nombre nuevo por intento: un intento cancelado a medias nunca pisa
        // al que sí termina.
        const fullPath = `${folder}/${Date.now()}-${cleanName}`;
        try {
            return await uploadOnce(file, fullPath);
        } catch (error) {
            lastError = error;
            console.warn(`Subida de ${file.name} falló (intento ${intento}/${UPLOAD_MAX_ATTEMPTS}):`, error);
            if (intento < UPLOAD_MAX_ATTEMPTS) {
                await new Promise(r => setTimeout(r, UPLOAD_RETRY_BASE_MS * intento));
            }
        }
    }
    throw lastError instanceof Error ? lastError : new Error('No se pudo subir el archivo.');
};

// Cache de subidas por CONTENIDO (nombre|tamaño|fecha) dentro de un mismo guardado.
// Evita que el mismo archivo se suba varias veces — p. ej. cuando una persona es
// socio Y titular, sus documentos venían en `partners[]` y en `titulars[]` y se
// subían por separado, dejando copias duplicadas en Storage.
type UploadCache = Map<string, Promise<string>>;

const fileKey = (f: File): string => `${f.name}|${f.size}|${f.lastModified}`;

// --- Estado del envío EN CURSO, compartido entre reintentos del usuario ---
// Si el envío falla a medias y el cliente pulsa "Finalizar" otra vez:
// - el cache conserva lo YA subido (no se re-sube; las entradas fallidas se
//   evictan para que el reintento las vuelva a intentar);
// - la carpeta de cédulas es la misma (un expediente = una subcarpeta);
// - la clave de idempotencia es la misma: el servidor la usa como ID del doc,
//   así un POST que llegó pero cuya respuesta se perdió NO duplica la venta.
// Todo se limpia tras un envío exitoso.
const uploadCachePersistente: UploadCache = new Map();
let carpetaIdsEnCurso: string | null = null;
let claveIdempotenciaEnCurso: string | null = null;

const nuevaClaveIdempotencia = (): string =>
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const resetEstadoEnvio = (): void => {
    uploadCachePersistente.clear();
    carpetaIdsEnCurso = null;
    claveIdempotenciaEnCurso = null;
};

// El reset lo dispara el FORMULARIO cuando su Promise.race observa el éxito,
// no saveFullApplication al terminar: si el watchdog del caller ya abandonó
// este envío y luego termina solo en segundo plano, el estado debe seguir
// intacto para que el reintento reutilice la misma clave y el servidor
// responda "duplicated" en vez de crear una segunda venta.
export const confirmarEnvioExitoso = (): void => resetEstadoEnvio();

// ============================================================
// VENTA NACIDA AL PAGAR — registro del borrador y reanudación
// ============================================================

const postJson = async (url: string, body: unknown, timeoutMs: number): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
};

// Sube el comprobante de transferencia EN EL INSTANTE del pago, con la misma
// tubería resiliente del envío final (estancamiento, tope, reintentos). Así el
// comprobante queda a salvo en Storage aunque el cliente nunca llegue a
// finalizar el formulario.
export const subirComprobante = async (file: File): Promise<string> => {
    await ensureUploadAuth();
    return uploadFileAndGetPath(file, 'comprobantes');
};

// Registra la venta como BORRADOR en el momento del pago. Idempotente: la
// draftKey generada aquí es el ID del doc; reintentar jamás duplica. Devuelve
// null solo si el servidor no respondió tras los reintentos (el flujo sigue:
// el expediente se creará al finalizar, como en el flujo clásico).
export const registrarPagoComoBorrador = async (
    data: AppFormData
): Promise<{ ventaId: string; token: string | null } | null> => {
    const draftKey = nuevaClaveIdempotencia();
    const body = {
        draftKey,
        applicant: data.applicant,
        packageName: data.packageName,
        companyType: data.companyType,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        totalAmount: data.totalAmount,
        transferBankName: data.transferBankName || null,
        paypalTransactionId: (data as unknown as Record<string, unknown>).paypalTransactionId || null,
        paymentReceipt: typeof data.paymentReceipt === 'string' ? data.paymentReceipt : null
    };
    for (let intento = 1; intento <= 3; intento++) {
        try {
            const res = await postJson('/api/registrar-pago', body, 15_000);
            if (res.ok) {
                const r = await res.json();
                return { ventaId: r.ventaId, token: r.token || null };
            }
            console.error(`registrar-pago respondió HTTP ${res.status} (intento ${intento}/3)`);
        } catch (e) {
            console.error(`registrar-pago falló (intento ${intento}/3):`, e);
        }
        if (intento < 3) await new Promise(r => setTimeout(r, 1_000 * intento));
    }
    return null;
};

export interface ExpedienteReanudado {
    ventaId: string;
    completado?: boolean;
    expediente?: {
        packageName: string | null;
        companyType: string | null;
        paymentStatus: string | null;
        paymentMethod: string | null;
        totalAmount: number | null;
        transferBankName: string | null;
        paymentReceipt: string | null;
        applicant: AppFormData['applicant'] | null;
        formulario: Record<string, unknown> | null;
    };
}

// Valida enlace (token del correo) + PIN contra el servidor y devuelve el
// borrador para retomarlo. Lanza Error con mensaje mostrable al cliente.
export const reanudarExpediente = async (token: string, pin: string): Promise<ExpedienteReanudado> => {
    let res: Response;
    try {
        res = await postJson('/api/reanudar', { token, pin }, 20_000);
    } catch {
        throw new Error('No pudimos conectar. Revisa tu internet e intenta de nuevo.');
    }
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(cuerpo.error || 'No se pudo reanudar el expediente.');
    }
    return cuerpo as ExpedienteReanudado;
};

// Autoguardado del avance (solo texto). Silencioso a propósito: un fallo de
// autosave jamás debe interrumpir al cliente que está llenando el formulario.
export const guardarBorrador = async (token: string, formulario: Record<string, unknown>): Promise<void> => {
    try {
        await postJson('/api/guardar-borrador', { token, formulario }, 15_000);
    } catch {
        // silencioso — el próximo autosave lo reintenta
    }
};

// Versión "solo texto" del formData para autoguardar: los File no viajan por
// JSON (los archivos se re-adjuntan al reanudar en otro dispositivo, igual que
// hace la restauración local de siempre).
export const extraerCamposTexto = (data: AppFormData): Record<string, unknown> => {
    const limpiarPersona = <T extends { idFront?: unknown; idBack?: unknown }>(p: T) =>
        ({ ...p, idFront: null, idBack: null });
    const out: Record<string, unknown> = {
        ...data,
        logoFile: null,
        onapiCertificate: null,
        paymentReceipt: typeof data.paymentReceipt === 'string' ? data.paymentReceipt : null,
        partners: (data.partners || []).map(limpiarPersona),
        titulars: (data.titulars || []).map(limpiarPersona)
    };
    delete out.reanudacionToken; // el token no se persiste dentro de la venta
    return out;
};

const resolveUpload = async (
    fileInput: Uploadable,
    folder: string,
    description: string,
    cache?: UploadCache
): Promise<string | null> => {
    if (!fileInput) return null;

    if (typeof fileInput === 'string') {
        return fileInput;
    }

    if (isBrowserFile(fileInput)) {
        if (cache) {
            const key = fileKey(fileInput);
            const existing = cache.get(key);
            if (existing) return existing;
            const pending = uploadFileAndGetPath(fileInput, folder).catch((error) => {
                // Evicta la entrada fallida: el próximo reintento del usuario
                // vuelve a subir ESTE archivo (lo ya subido se conserva).
                cache.delete(key);
                console.error(`Fallo definitivo subiendo ${description}:`, error);
                throw new Error(`No se pudo subir ${description}.`);
            });
            cache.set(key, pending);
            return pending;
        }
        try {
            return await uploadFileAndGetPath(fileInput, folder);
        } catch {
            throw new Error(`No se pudo subir ${description}.`);
        }
    }

    return null;
};

const serializePartners = async (partners: Partner[] = [], cache?: UploadCache, carpeta = 'identidades'): Promise<SerializedPartner[]> => {
    return Promise.all(partners.map(async (partner, index) => {
        const [idFront, idBack] = await Promise.all([
            resolveUpload(partner.idFront, carpeta, `SOCIO ${index + 1} (Frente)`, cache),
            resolveUpload(partner.idBack, carpeta, `SOCIO ${index + 1} (Dorso)`, cache)
        ]);

        return {
            ...partner,
            idFront,
            idBack
        };
    }));
};

const titularHasData = (titular: Titular): boolean => {
    const textValues = [
        titular.names,
        titular.surnames,
        titular.idNumber
    ];

    const hasText = textValues.some(value => typeof value === 'string' && value.trim().length > 0);
    const hasFiles = Boolean(titular.idFront || titular.idBack);

    return hasText || hasFiles;
};

const serializeTitulars = async (titulars: Titular[] = [], cache?: UploadCache, carpeta = 'identidades'): Promise<SerializedTitular[]> => {
    const filtered = titulars.filter(titularHasData);

    if (filtered.length === 0) {
        return [];
    }

    return Promise.all(filtered.map(async (titular, index) => {
        const [idFront, idBack] = await Promise.all([
            resolveUpload(titular.idFront, carpeta, `TITULAR ${index + 1} (Frente)`, cache),
            resolveUpload(titular.idBack, carpeta, `TITULAR ${index + 1} (Dorso)`, cache)
        ]);

        return {
            ...titular,
            idFront,
            idBack
        };
    }));
};

export const saveFullApplication = async (data: AppFormData): Promise<any> => {
    const {
        logoFile,
        onapiCertificate,
        paymentReceipt,
        partners,
        titulars,
        ...textFields
    } = data;

    try {
        // Sesión garantizada (anónima para invitados) antes de subir — las
        // reglas de Storage exigen auth para escribir.
        await ensureUploadAuth();

        // Cache persistente entre reintentos: el mismo archivo se sube una
        // única vez aunque el usuario tenga que pulsar "Finalizar" varias veces.
        const uploadCache = uploadCachePersistente;

        // Carpeta única por solicitud: agrupa las cédulas de ESTE expediente
        // en vez de mezclarlas en la carpeta plana global. Se conserva entre
        // reintentos para no partir el expediente en dos carpetas.
        if (!carpetaIdsEnCurso) {
            carpetaIdsEnCurso = `identidades/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        }
        const carpetaIds = carpetaIdsEnCurso;

        // Venta nacida al pagar: la clave ES el ID del borrador, así el
        // finalizar COMPLETA ese doc en vez de crear otro. Sin borrador
        // (fallo al registrar el pago, flujo legacy) se genera una clave.
        if (data.ventaBorradorId) {
            claveIdempotenciaEnCurso = data.ventaBorradorId;
        } else if (!claveIdempotenciaEnCurso) {
            claveIdempotenciaEnCurso = nuevaClaveIdempotencia();
        }

        const [logoUrl, onapiCertUrl, receiptUrl, partnersWithUrls, titularsWithUrls] = await Promise.all([
            resolveUpload(logoFile, 'logos', 'LOGO', uploadCache),
            resolveUpload(onapiCertificate, 'certificados', 'CERTIFICADO ONAPI', uploadCache),
            resolveUpload(paymentReceipt, 'comprobantes', 'COMPROBANTE DE PAGO', uploadCache),
            serializePartners(partners, uploadCache, carpetaIds),
            serializeTitulars(titulars, uploadCache, carpetaIds)
        ]);

        // OJO: la sesión anónima NO cuenta como usuario del cliente — una venta
        // de invitado debe quedar "huérfana" (sin userId) para que luego
        // linkSaleToUser pueda vincularla a la cuenta real.
        const currentUser = auth.currentUser;
        const esUsuarioReal = !!currentUser && !currentUser.isAnonymous;

        const payload: SerializedForm & { userId?: string; userEmail?: string | null; idempotencyKey: string } = {
            ...(textFields as SerializedForm),
            logoFile: logoUrl,
            onapiCertificate: onapiCertUrl,
            paymentReceipt: receiptUrl,
            partners: partnersWithUrls,
            titulars: titularsWithUrls,
            userId: esUsuarioReal ? currentUser.uid : undefined,
            userEmail: esUsuarioReal ? (currentUser.email || null) : null,
            idempotencyKey: claveIdempotenciaEnCurso
        };

        const payloadRecord = payload as Record<string, unknown>;
        delete payloadRecord.identityDocFront;
        delete payloadRecord.identityDocBack;
        // Estado de reanudación: es transporte del cliente, no dato de la venta
        // (el ID del borrador ya viaja como idempotencyKey).
        delete payloadRecord.ventaBorradorId;
        delete payloadRecord.reanudacionToken;

        // POST con timeout: sin esto, un fetch que nunca responde dejaba el
        // envío colgado para siempre. Si aborta, reintentar es seguro: la clave
        // de idempotencia garantiza que no se crean ventas duplicadas.
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), SUBMIT_FETCH_TIMEOUT_MS);
        let response: Response;
        try {
            response = await fetch('/api/procesar-solicitud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } catch {
            throw new Error(
                'Se perdió la conexión al enviar el expediente. Tus archivos ya subidos quedaron guardados: ' +
                'revisa tu internet y pulsa "Finalizar Expediente" de nuevo — no se creará un duplicado ni se te cobrará de nuevo.'
            );
        } finally {
            clearTimeout(fetchTimer);
        }

        if (!response.ok) {
            const errorMessage = await response.text().catch(() => `HTTP ${response.status}`);
            throw new Error(`Error al enviar la solicitud: ${errorMessage}`);
        }

        // Sin reset aquí: lo hace el formulario vía confirmarEnvioExitoso()
        // solo cuando ÉL observa el éxito (ver comentario de esa función).
        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Error desconocido guardando la solicitud.');
    }
};

/**
 * Vincula una venta huérfana (sin usuario) a un usuario autenticado.
 * Esto permite conectar pagos realizados antes del login con la cuenta del cliente.
 * 
 * @param saleId - ID del documento de venta en Firestore
 * @param userId - UID del usuario de Firebase Auth
 * @param userEmail - Email del usuario (opcional, para referencia)
 * @returns Promise<boolean> - true si se vinculó exitosamente
 */
export const linkSaleToUser = async (
    saleId: string, 
    userId: string, 
    userEmail?: string
): Promise<boolean> => {
    if (!saleId || !userId) {
        return false;
    }

    try {
        const saleRef = doc(db, 'ventas', saleId);
        
        await updateDoc(saleRef, {
            userId: userId,
            userEmail: userEmail || null,
            linkedAt: serverTimestamp(),
            status: 'vinculado' // Actualiza estado para indicar que ya tiene dueño
        });

        return true;
    } catch {
        // No lanzamos error para no romper el flujo de auth
        return false;
    }
};