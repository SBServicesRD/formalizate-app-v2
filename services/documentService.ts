import { FormData as AppFormData, Partner, Titular } from '../types';
import { storage, db, auth } from './firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

const uploadFileAndGetUrl = async (file: File, folder: string, description: string): Promise<string> => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}-${cleanName}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

const resolveUpload = async (
    fileInput: Uploadable,
    folder: string,
    description: string
): Promise<string | null> => {
    if (!fileInput) return null;

    if (typeof fileInput === 'string') {
        return fileInput;
    }

    if (isBrowserFile(fileInput)) {
        try {
            return await uploadFileAndGetUrl(fileInput, folder, description);
        } catch (error) {
            console.error(`Error subiendo ${description}`, error);
            throw new Error(`No se pudo subir ${description}.`);
        }
    }

    console.warn(`${description} no es un File válido. Se omite este campo.`);
    return null;
};

const serializePartners = async (partners: Partner[] = []): Promise<SerializedPartner[]> => {
    return Promise.all(partners.map(async (partner, index) => {
        const [idFront, idBack] = await Promise.all([
            resolveUpload(partner.idFront, 'identidades', `SOCIO ${index + 1} (Frente)`),
            resolveUpload(partner.idBack, 'identidades', `SOCIO ${index + 1} (Dorso)`)
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

const serializeTitulars = async (titulars: Titular[] = []): Promise<SerializedTitular[]> => {
    const filtered = titulars.filter(titularHasData);

    if (filtered.length === 0) {
        return [];
    }

    return Promise.all(filtered.map(async (titular, index) => {
        const [idFront, idBack] = await Promise.all([
            resolveUpload(titular.idFront, 'identidades', `TITULAR ${index + 1} (Frente)`),
            resolveUpload(titular.idBack, 'identidades', `TITULAR ${index + 1} (Dorso)`)
        ]);

        return {
            ...titular,
            idFront,
            idBack
        };
    }));
};

export const saveFullApplication = async (data: AppFormData): Promise<any> => {
    console.log('Iniciando guardado de solicitud');

    const {
        logoFile,
        onapiCertificate,
        paymentReceipt,
        partners,
        titulars,
        ...textFields
    } = data;

    try {
        const [logoUrl, onapiCertUrl, receiptUrl, partnersWithUrls, titularsWithUrls] = await Promise.all([
            resolveUpload(logoFile, 'logos', 'LOGO'),
            resolveUpload(onapiCertificate, 'certificados', 'CERTIFICADO ONAPI'),
            resolveUpload(paymentReceipt, 'comprobantes', 'COMPROBANTE DE PAGO'),
            serializePartners(partners),
            serializeTitulars(titulars)
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

        console.log('Enviando solicitud con userId:', currentUser?.uid || 'NO AUTENTICADO');

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
        console.error('Error guardando la solicitud', error);
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
        console.warn('⚠️ linkSaleToUser: saleId o userId vacío');
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

        console.log(`Venta ${saleId} vinculada exitosamente al usuario ${userId}`);
        return true;
    } catch (error) {
        console.error('Error vinculando venta al usuario:', error);
        // No lanzamos error para no romper el flujo de auth
        return false;
    }
};