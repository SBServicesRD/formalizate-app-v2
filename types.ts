import { PackageName } from './constants';

export enum AppStep {
    Landing,
    StepTypeSelection,
    StepA,
    StepB,
    StepC,
    Summary,
    Payment,
    PostPaymentWelcome,
    PostPaymentForm,
    Success,
    Login,
    Dashboard
}

export type MaritalStatus = 'Soltero(a)' | 'Casado(a)' | 'Unión Libre';
export type MatrimonialRegime = 'Comunidad de Bienes' | 'Separación de Bienes';
export type CompanyType = 'SRL' | 'SAS' | 'EIRL';
export type CompanyRole = 'Gerente' | 'Socio';

export interface Titular {
    id: number;
    names: string;
    surnames: string;
    idNumber: string;
    idFront: File | null;
    idBack: File | null;
}

export interface Applicant {
    names: string;
    surnames: string;
    email: string;
    phone: string;
    isTitular: boolean;
}

export interface Partner {
    id: number;
    names: string; 
    surnames: string;
    nationality: string;
    birthDate: string;
    maritalStatus: MaritalStatus;
    matrimonialRegime?: MatrimonialRegime;
    profession: string;
    documentType: 'Cédula' | 'Pasaporte';
    idNumber: string;
    idFront: File | null;
    idBack: File | null;
    residenceCountry: string;
    addressStreet: string;
    addressNumber: string;
    addressBuilding?: string;
    addressSuite?: string;
    addressSector: string;
    addressCity: string;
    addressProvince: string;
    postalCode?: string;
    mobilePhone: string;
    email: string;
    roles: string[];
    percentage: number;
    shares: number;
}

export interface Manager {
    type: 'Socio' | 'Tercero';
    name: string;
    idNumber: string;
    nationality?: string;
}

export interface FormData {
    companyType: CompanyType;
    hasRegisteredName: 'Sí' | 'No';
    onapiNumber?: string;
    onapiCertificate?: File | null;
    companyName: string;
    altName1?: string;
    altName2?: string;
    nameOwnership: 'Un solo socio' | 'Dos socios';
    socialObject: string;
    companyStreet: string;
    companyStreetNumber: string;
    companyBuilding?: string;
    companySuite?: string;
    companySector: string;
    companyCity: string;
    companyProvince: string;
    applicant: Applicant;
    titulars: Titular[];
    requestDate?: string;
    packageName?: PackageName; 
    paymentMethod?: 'transfer' | 'card' | 'paypal' | 'other';
    paymentStatus?: 'unpaid' | 'pending_confirmation' | 'paid';
    paymentReceipt?: File | null;
    transferBankName?: string;
    totalAmount?: number;
    hasLogo?: 'Sí' | 'No';
    logoFile?: File | null;
    fiscalClosing: string;
    socialCapital: number;
    partners: Partner[];
    productsAndServices?: string;
    activityMainDGII?: string;
    activitySecondaryDGII?: string;
    operationsStartDate?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    localType?: 'Propio' | 'Alquilado' | 'Oficina Virtual' | 'Domicilio Socio';
    referencePoint?: string;
    managementDuration: number;
    manager: Manager;
    digitalSignatureHolderId?: number;
    legalSignaturePowers?: 'Solo el Gerente' | 'Firma Conjunta' | 'Firma Indistinta';
    bankPowers?: 'Solo el Gerente' | 'Firma Conjunta' | 'Firma Indistinta';
    bankAuthorizedPerson1?: string;
    bankAuthorizedPerson2?: string;
    ncfTypes: string[];
    monthlyNcfVolume?: string;
    hasEmployees?: 'Sí' | 'No';
    commercialRef1?: string;
    commercialRef2?: string;
    bankRef1?: string;
    bankRef2?: string;
}