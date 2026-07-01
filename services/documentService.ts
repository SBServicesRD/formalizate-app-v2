import { FormData as AppFormData, Partner, Titular } from '../types';
import { storage, db, auth } from './firebase'; 
import { ref, uploadBytes } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

// Sube el archivo y devuelve su RUTA en Storage (no la URL de descarga).
// Generar la URL con getDownloadURL() requiere permiso de LECTURA, que desde
// el endurecimiento de seguridad solo se concede a usuarios autenticados; un
// cliente invitado obtendría 403 y se rompería el cierre del expediente.
// La escritura sigue abierta, así que la subida funciona; el servidor
// (Admin SDK, ignora las reglas) convierte esta ruta en una URL descargable.
const uploadFileAndGetPath = async (file: File, folder: string): Promise<string> => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}-${cleanName}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return snapshot.ref.fullPath;
};

// Cache de subidas por CONTENIDO (nombre|tamaño|fecha) dentro de un mismo guardado.
// Evita que el mismo archivo se suba varias veces — p. ej. cuando una persona es
// socio Y titular, sus documentos venían en `partners[]` y en `titulars[]` y se
// subían por separado, dejando copias duplicadas en Storage.
type UploadCache = Map<string, Promise<string>>;

const fileKey = (f: File): string => `${f.name}|${f.size}|${f.lastModified}`;

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
            const pending = uploadFileAndGetPath(fileInput, folder).catch(() => {
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

const serializePartners = async (partners: Partner[] = [], cache?: UploadCache): Promise<SerializedPartner[]> => {
    return Promise.all(partners.map(async (partner, index) => {
        const [idFront, idBack] = await Promise.all([
            resolveUpload(partner.idFront, 'identidades', `SOCIO ${index + 1} (Frente)`, cache),
            resolveUpload(partner.idBack, 'identidades', `SOCIO ${index + 1} (Dorso)`, cache)
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

const serializeTitulars = async (titulars: Titular[] = [], cache?: UploadCache): Promise<SerializedTitular[]> => {
    const filtered = titulars.filter(titularHasData);

    if (filtered.length === 0) {
        return [];
    }

    return Promise.all(filtered.map(async (titular, index) => {
        const [idFront, idBack] = await Promise.all([
            resolveUpload(titular.idFront, 'identidades', `TITULAR ${index + 1} (Frente)`, cache),
            resolveUpload(titular.idBack, 'identidades', `TITULAR ${index + 1} (Dorso)`, cache)
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
        // Un solo cache por guardado: el mismo archivo se sube una única vez.
        const uploadCache: UploadCache = new Map();

        const [logoUrl, onapiCertUrl, receiptUrl, partnersWithUrls, titularsWithUrls] = await Promise.all([
            resolveUpload(logoFile, 'logos', 'LOGO', uploadCache),
            resolveUpload(onapiCertificate, 'certificados', 'CERTIFICADO ONAPI', uploadCache),
            resolveUpload(paymentReceipt, 'comprobantes', 'COMPROBANTE DE PAGO', uploadCache),
            serializePartners(partners, uploadCache),
            serializeTitulars(titulars, uploadCache)
        ]);

        const currentUser = auth.currentUser;
        
        const payload: SerializedForm & { userId?: string; userEmail?: string | null } = {
            ...(textFields as SerializedForm),
            logoFile: logoUrl,
            onapiCertificate: onapiCertUrl,
            paymentReceipt: receiptUrl,
            partners: partnersWithUrls,
            titulars: titularsWithUrls,
            userId: currentUser?.uid,
            userEmail: currentUser?.email || null
        };

        const payloadRecord = payload as Record<string, unknown>;
        delete payloadRecord.identityDocFront;
        delete payloadRecord.identityDocBack;

        const response = await fetch('/api/procesar-solicitud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorMessage = await response.text().catch(() => `HTTP ${response.status}`);
            throw new Error(`Error al enviar la solicitud: ${errorMessage}`);
        }

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