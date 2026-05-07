# 📚 CONTEXTO COMPLETO: FORMALIZATE.APP-V2
**Para:** Agentes Notion, Claude Code, y sistemas de prompting  
**Última Actualización:** 2026-05-02  
**Versión:** 1.0

> Este documento es tu referencia completa. Úsalo para contextualizar cualquier tarea que quieras hacer en el proyecto.

---

## 🎯 RESUMEN RÁPIDO

**Qué es:** Plataforma SaaS para automatizar la constitución de empresas en República Dominicana.  
**Tech Stack:** React 19 + TypeScript + Vite + Firebase + Google Gemini AI + PayPal  
**Usuarios:** Emprendedores que quieren formalizar su negocio (30-60 años, no muy tech)  
**Precio:** RD$ 27,900 - RD$ 64,900 por solicitud  
**Estado:** En producción, funcionando para flujo SRL/EIRL  

---

## 🏗️ ARQUITECTURA COMPLETA

### Frontend (SPA React)

```
App.tsx (raíz)
├── Estado Global
│   ├── formData: FormData (objeto maestro)
│   ├── currentStep: AppStep (11 pasos)
│   ├── highestStepReached: número (para navegación)
│   ├── user: Firebase User (autenticado o null)
│   ├── page: PageView ('main' | 'privacy' | 'terms' | 'refund' | 'login')
│   └── authLoading: boolean
│
├── Persistencia
│   ├── localStorage: sbs_form_v7_user_{uid} | sbs_form_v7_guest
│   └── Firestore: formalizate-app-prod database
│
├── Navegación (sin React Router)
│   ├── goToNextStep() → incrementa paso
│   ├── goToPrevStep() → decrementa paso
│   ├── goToStep(step) → salta si permitido
│   └── setPage() → cambia a vista diferente (legal pages, login)
│
└── Componentes (23 en total)
    ├── Landing (Marketing + pricing)
    ├── StepTypeSelection (SRL/SAS/EIRL)
    ├── StepA (Empresa 66 KB)
    ├── StepB (Socios 77 KB)
    ├── StepC (Gerencia 11 KB)
    ├── Summary (Revisión)
    ├── PaymentPage (lazy-loaded)
    ├── Login/Signup (autenticación)
    ├── PostPaymentForm (datos adicionales 44 KB)
    ├── Success (confirmación)
    ├── SecureDashboard (lazy-loaded)
    └── Legal pages (TermsOfServicePage, PrivacyPolicyPage, RefundPolicyPage - lazy)
```

### Backend (Node.js + Express)

```
server.cjs
├── /api/verify-payment-status     [GET]  Verifica si uid pagó
├── /api/procesar-solicitud        [POST] Guarda en Firestore
├── /api/optimize-text             [POST] Mejora con Gemini
├── /api/reviews                   [GET]  Obtiene reseñas Google
└── /* (fallback a index.html para SPA)

Cloud Functions (functions/index.js)
├── onVentaCreate (trigger: nueva venta)
│   ├── Genera orderId único
│   ├── Envía email confirmación
│   └── Maneja pagos huérfanos
│
└── onVentaUpdate (trigger: cambio status)
    ├── Notifica cambio de estado
    ├── Envía emails transaccionales
    └── Actualiza dashboard
```

### Bases de Datos

```
Firestore (formalizate-app-prod)
├── /ventas/{ventaId}
│   ├── orderId: "ORD-YYMMDDXXXXXX"
│   ├── userId: Firebase UID
│   ├── userEmail: string
│   ├── status: "inicio" | "onapi_listo" | "completado"
│   ├── paymentStatus: "unpaid" | "pending_confirmation" | "paid"
│   ├── packageName: "Starter Pro" | "Essential 360" | "Unlimitech"
│   ├── monto: number (RD$)
│   ├── applicant: { names, surnames, email, phone }
│   ├── titulars: Titular[]
│   ├── partners: Partner[]
│   └── fechaCreacion: timestamp
│
├── /usuarios/{uid}
│   ├── email: string
│   ├── displayName: string
│   ├── photoURL?: string
│   └── createdAt: timestamp
│
└── /solicitudes/{id} (respaldo de aplicaciones)
```

### Cloud Storage

```
Estructura de carpetas:
├── /logos/{filename}              → Logos de empresa
├── /certificados/{filename}       → Certificados ONAPI
├── /comprobantes/{filename}       → Comprobantes de pago
├── /identidades/{filename}        → Documentos de identidad (cédulas)
```

---

## 💾 OBJETO DE DATOS PRINCIPAL: FormData

Este es el corazón del proyecto. Todo lo que el usuario llena termina aquí.

```typescript
interface FormData {
  // ============= EMPRESA =============
  companyType: 'SRL' | 'SAS' | 'EIRL'          // Tipo societario
  companyName: string                          // Nombre comercial (sanitizado)
  hasRegisteredName: 'Sí' | 'No'               // ¿Ya existe nombre?
  onapiNumber?: string                         // 6 dígitos
  onapiCertificate?: File | null               // Certificado escaneado
  
  altName1?: string                            // Nombres alternativos
  altName2?: string
  nameOwnership: 'Un solo socio' | 'Dos socios'
  
  socialObject: string                         // Descripción legal actividades
  // ⬆️ Gemini mejora esto automáticamente
  
  // ============= DIRECCIÓN COMERCIAL =============
  companyStreet: string
  companyStreetNumber: string
  companyBuilding?: string
  companySuite?: string
  companySector: string
  companyCity: string
  companyProvince: string
  
  // ============= SOLICITANTE (CONTACTO) =============
  applicant: {
    names: string
    surnames: string
    email: string
    phone: string
    isTitular: boolean  // ⬅️ Si true, se sincroniza con titulars[0]
  }
  
  // ============= TITULARES (PROPIETARIOS) =============
  titulars: Titular[] {
    id: number                    // Date.now()
    names: string
    surnames: string
    idNumber: string             // Cédula (formato: XXX-XXXXXXX-X)
    idFront: File | null
    idBack: File | null
  }
  // EIRL: siempre 1 titular
  // SRL: 1 o 2 titulares
  
  // ============= SOCIOS (ACCIONISTAS) =============
  partners: Partner[] {
    id: number
    names: string
    surnames: string
    nationality: string          // País
    birthDate: string            // DD/MM/YYYY, edad >= 18
    maritalStatus: 'Soltero(a)' | 'Casado(a)' | 'Unión Libre'
    matrimonialRegime?: 'Comunidad de Bienes' | 'Separación de Bienes'
    profession: string
    
    // ---- Identidad ----
    documentType: 'Cédula' | 'Pasaporte'
    idNumber: string
    idFront: File | null
    idBack: File | null
    
    // ---- Dirección ----
    residenceCountry: string
    addressStreet: string
    addressStreetNumber: string
    addressBuilding?: string
    addressSuite?: string
    addressSector: string
    addressCity: string
    addressProvince: string
    postalCode?: string
    
    // ---- Contacto ----
    mobilePhone: string
    email: string
    
    // ---- Participación ----
    roles: string[]              // ['Socio', 'Gerente']
    percentage: number           // 0-100 (suma = 100)
    shares: number               // calculated: (capital / 100) * percentage
  }
  // Validación: suma de porcentajes = 100%
  // EIRL: solo 1 partner con 100%, rol Gerente forzado
  
  // ============= GERENCIA =============
  manager: {
    type: 'Socio' | 'Tercero'
    name: string
    idNumber: string
    nationality?: string
  }
  
  managementDuration: number        // Default: 6 años
  digitalSignatureHolderId?: number // ID del partner que firma
  
  legalSignaturePowers: 'Solo el Gerente' | 'Firma Conjunta' | 'Firma Indistinta'
  bankPowers: 'Solo el Gerente' | 'Firma Conjunta' | 'Firma Indistinta'
  bankAuthorizedPerson1?: string
  bankAuthorizedPerson2?: string
  
  // ============= FINANCIERO =============
  socialCapital: number            // Default: 100,000
  // ⬆️ ICC Tax = (capital - 100,000) * 0.01 si > 100,000
  
  fiscalClosing: string            // Default: "31 de Diciembre"
  
  // ============= PAGO =============
  packageName?: 'Starter Pro' | 'Essential 360' | 'Unlimitech'
  totalAmount?: number             // paquete + ICC tax
  paymentMethod?: 'transfer' | 'card' | 'paypal' | 'other'
  paymentStatus?: 'unpaid' | 'pending_confirmation' | 'paid'
  paymentReceipt?: File | null     // Comprobante de transferencia
  transferBankName?: string        // BanReservas, Popular, etc.
  
  // ============= DOCUMENTACIÓN =============
  hasLogo?: 'Sí' | 'No'
  logoFile?: File | null
  
  productsAndServices?: string
  activityMainDGII?: string
  activitySecondaryDGII?: string
  operationsStartDate?: string     // DD/MM/YYYY
  
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  
  localType?: 'Propio' | 'Alquilado' | 'Oficina Virtual' | 'Domicilio Socio'
  referencePoint?: string
  
  // ============= COMPROBANTES FISCALES (NCF) =============
  ncfTypes: string[]               // B01, B02, B14, B15
  monthlyNcfVolume?: string
  
  // ============= REFERENCIAS =============
  hasEmployees?: 'Sí' | 'No'
  commercialRef1?: string
  commercialRef2?: string
  bankRef1?: string
  bankRef2?: string
  
  // ============= META =============
  requestDate?: string             // Fecha de solicitud
}
```

**Notas importantes:**
- Los `File` objects NO se persisten en localStorage (no son JSON serializables)
- Al cargar desde localStorage, se descartan y se re-cargan desde inputs
- Al guardar en Firestore, se convierten a URLs de Cloud Storage
- Validación ocurre en cada paso (blur event, submitted flag)

---

## 🔄 FLUJO DE USUARIO: PASO A PASO

### Paso 0: Landing (LandingPage.tsx)
```
Usuario llega al sitio
├─ Ve hero section + pricing
├─ Lee secciones de beneficios (carrusel 3.5s auto-rotate)
├─ Revisa FAQ (6 preguntas con accordión)
└─ Click en plan específico
   └─ handleStartFlow(packageName)
      └─ updateFormData({packageName})
      └─ goToStep(StepTypeSelection)
```

### Paso 1: Selección de Tipo (StepTypeSelection.tsx)
```
Usuario elige tipo societario
├─ SRL (recomendado)
│  └─ socialCapital = 100,000
├─ EIRL
│  └─ socialCapital = 50,000
│  └─ Fuerza 1 socio
└─ Otros (SAS, S.A.) deshabilitados
   └─ goToNextStep() → StepA
```

### Paso 2: Identidad (StepA.tsx - 66 KB, MÁS COMPLEJO)
```
Usuario carga información de empresa + solicitante
├─ Búsqueda ONAPI
├─ Nombre comercial (sanitizado)
├─ Dirección (calle, sector, ciudad, provincia)
├─ Solicitante (nombres, apellidos, email, teléfono)
├─ ¿Es solicitante titular?
│  └─ Si sí, sync automático con titulars[0]
├─ Titulares
│  ├─ Upload cédula front/back
│  └─ EIRL: solo 1, SRL: 1-2
├─ Logo (opcional)
└─ Certificado ONAPI (si ya existe nombre)
   └─ Validaciones en tiempo real (sanitización, formato)
   └─ goToNextStep() → StepB
```

### Paso 3: Socios (StepB.tsx - 77 KB, MAYORMENTE PARTNERS)
```
Usuario agrega socios y define estructura de capital
├─ Agregar partner (click "Agregar Socio")
├─ Información completa por socio
│  ├─ Identidad (cédula, nombres, apellidos, nacionalidad)
│  ├─ Datos personales (fecha nacimiento, estado civil, profesión)
│  ├─ Dirección (calle, sector, ciudad, provincia, CP)
│  ├─ Contacto (teléfono, email)
│  ├─ Participación (% o acciones calculadas auto)
│  ├─ Roles (Socio, Gerente)
│  └─ Upload cédula front/back
│
├─ Distribución automática de shares
│  ├─ shares = (capital / 100) * percentage
│  └─ Suma % debe = 100
│
├─ Firma Digital (¿quién firma electrónicamente?)
├─ Poderes Legales (Solo Gerente / Firma Conjunta / Indistinta)
├─ Poderes Bancarios (igual)
│
├─ EIRL especial
│  ├─ Fuerza 100% participación
│  └─ Auto-asigna rol Gerente
│
└─ Edición in-place
   ├─ Hover = opciones edit/delete
   └─ Click edit = modal editable
   └─ goToNextStep() → StepC o Summary (depende flujo)
```

### Paso 4: Administración (StepC.tsx - 11 KB, OPCIONAL)
```
Usuario define gerencia (puede saltarse según flujo)
├─ Tipo de gerente
│  ├─ Socio (dropdown de partners existentes)
│  └─ Tercero (nombre, cédula, nacionalidad)
└─ Validaciones mínimas
   └─ goToNextStep() → Summary
```

### Paso 5: Revisión (SummaryPage.tsx)
```
Usuario revisa toda la información
├─ Card-based layout
├─ Datos de empresa
├─ Solicitante
├─ Titulares
├─ Socios (listado)
├─ Paquete seleccionado
├─ Total a pagar (paquete + ICC tax)
│
├─ Botones
│  ├─ Editar (vuelve a pasos previos)
│  └─ Continuar (→ Payment)
└─ goToNextStep() → Payment
```

### Paso 6: Pago (PaymentPage.tsx - lazy-loaded)
```
Usuario selecciona método de pago
├─ Tabla de 3 planes (si quiere cambiar)
├─ Cálculo: packagePrice + ICCTax(socialCapital)
├─ Conversión de divisa (USD → DOP dinámica)
│
├─ Métodos disponibles
│  ├─ Transferencia Bancaria
│  │  ├─ Modal con datos (BanReservas, Popular, BHD, etc.)
│  │  ├─ Upload comprobante (Gemini valida)
│  │  └─ Status → 'pending_confirmation'
│  │
│  ├─ PayPal
│  │  ├─ PayPalButtons component
│  │  └─ handlePayPalApprove() → ID en localStorage
│  │
│  ├─ Tarjeta (Azul)
│  │  └─ Integración directa
│  │
│  └─ Google Pay
│     └─ Integración nativa
│
├─ Ventas Huérfanas
│  └─ Si paga sin login, localStorage.setItem(ORPHAN_SALE_KEY, saleId)
│  └─ Posterior: linkSaleToUser() vincula al UID
│
└─ onPaymentSuccess()
   ├─ updateFormData({paymentStatus: 'paid'})
   └─ goToStep(AppStep.Login)
```

### Paso 7: Signup Post-Pago (SignupPostPaymentPage.tsx)
```
Usuario crea cuenta (SOLO POST-PAGO)
├─ NUNCA es login, siempre es crear cuenta nueva
├─ Email + Contraseña (6+ caracteres)
├─ Google OAuth
│
├─ createUserWithEmailAndPassword() en Firebase Auth
│
├─ Si email ya existe → error claro
├─ Si éxito
│  └─ linkSaleToUser(orphanSaleId, userId)
│     └─ Vincula venta al nuevo usuario
│
└─ goToStep(PostPaymentWelcome)
```

### Paso 8: Bienvenida Post-Pago (PostPaymentWelcome.tsx)
```
Confirmación simple
├─ CheckCircle icon
├─ "Pago confirmado, iniciamos gestión en ONAPI"
└─ CTA: "Completar Expediente"
   └─ goToNextStep() → PostPaymentForm
```

### Paso 9: Formulario Maestro (PostPaymentForm.tsx - 44 KB)
```
Usuario completa datos post-pago
├─ Contacto (persona, email, teléfono)
├─ Ubicación (tipo local, punto referencia)
├─ Logo (si no cargó antes)
├─ Actividades (DGII principales + secundarias)
├─ Operación (inicio, volumen NCF)
│
├─ Opcionales
│  ├─ Empleados (sí/no)
│  ├─ Referencias comerciales (2)
│  ├─ Referencias bancarias (2)
│  ├─ Datos bancarios para depósitos
│  └─ Firmas + poderes
│
└─ handleFinalSubmit()
   ├─ saveFullApplication(formData)
   │  ├─ Sube all Files a Cloud Storage
   │  ├─ POST /api/procesar-solicitud
   │  └─ Firestore guarda solicitud completa
   ├─ localStorage.removeItem(key)
   └─ goToStep(Success)
```

### Paso 10: Éxito (SuccessPage.tsx)
```
Confirmación final
├─ ID referencia único
├─ Resumen (solicitante, paquete, fecha, total)
├─ "Email enviado a xxx@xxx.com"
└─ CTA: "Ir al Dashboard"
   └─ goToStep(Dashboard)
```

### Paso 11: Dashboard (SecureDashboard → DashboardPage.tsx - lazy-loaded)
```
Usuario autenticado ve estado
├─ Header: logo, nombre, ID expediente, status, logout
├─ Timeline: 6 etapas (Inicio → Validación → ONAPI → Redacción → Mercantil → RNC/DGII)
├─ Documentos descargables (6 docs, algunos locked)
├─ Support: chat, WhatsApp, email
└─ NOTA: Simulado, status no se actualiza en tiempo real
   └─ TODO: Implementar Firestore listeners
```

---

## 🔐 SEGURIDAD Y VALIDACIONES

### Validaciones por Tipo de Campo

```typescript
// Cédula (formato dominicano)
validateCedula(cedula: string): boolean
├─ Exactamente 11 dígitos
├─ Formato: XXX-XXXXXXX-X
└─ formatCedula() aplica máscara visual

// Email
validateEmail(email: string): boolean
├─ Regex pragmático (no RFC 5322)
├─ ⚠️ Mejora: validar en servidor con regex más estricta

// Teléfono
validatePhoneNumber(phone: string): boolean
├─ Internacional: 8-16 dígitos
├─ Local DO: máscara 809-000-0000
└─ Soporta +, espacios, guiones, paréntesis

// Fecha de Nacimiento
validateBirthDate(date: string): boolean
├─ Formato: DD/MM/YYYY
├─ Fecha real
├─ Mínimo 18 años

// Fecha General
validateDate(date: string): boolean
├─ Formato: DD/MM/YYYY
└─ Rango: 1900-2100

// Nombre de Empresa
sanitizeCompanyName(name: string): string
├─ Permite: letras, números, espacios, puntos, comas, guiones, &
├─ Soporta: tildes y ñ
└─ Elimina: HTML, emojis, caracteres de control

// Entrada General
sanitizeInput(input: string): string
├─ Elimina emojis y símbolos Unicode extendidos
├─ Elimina tags HTML (< y >)
├─ Elimina caracteres de control
└─ Trim whitespace
```

### Protecciones Implementadas

✅ **HTTPS + HSTS:** 1 año, includeSubDomains  
✅ **CSP Headers:** Whitelist de APIs (Gemini, PayPal, Google, Firebase)  
✅ **XSS Prevention:** Sanitización de inputs  
✅ **CSRF:** Implícito vía Firebase Auth  
✅ **Rate Limiting:** 100 req/15 min en `/api`  
✅ **Firebase Security Rules:** Firestore + Storage protegidas  
✅ **Versionado localStorage:** v7 invalida versiones antiguas  

### Brechas de Seguridad

❌ **Sin Encriptación Client-side:** Datos en localStorage en texto plano  
❌ **Sin Audit Trail:** No se registra quién/cuándo cambió datos  
⚠️ **File Upload Sin Límite:** Potencial DoS (implementar max 5MB)  
⚠️ **Payment Receipt:** Solo análisis Gemini (indicativo, no definitivo)  

---

## 📦 COMPONENTES PRINCIPALES Y PATRONES

### Patrón de Props Drilling

```typescript
// App.tsx (raíz) pasa a componente hijo
<StepA 
  formData={formData} 
  updateFormData={updateFormData}        // (data: Partial<FormData>) => void
  nextStep={goToNextStep}
  prevStep={goToPrevStep}
/>

// StepA.tsx (hijo) usa props
const StepA = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  
  const handleChange = (field: string, value: any) => {
    updateFormData({ [field]: value })
    validateField(field, value)
  }
  
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field])
  }
  
  return (
    <input
      onBlur={() => handleBlur('companyName')}
      onChange={(e) => handleChange('companyName', e.target.value)}
      // Solo muestra error si touched
      {...(touched.companyName && errors.companyName && { error: true })}
    />
  )
}
```

### Lazy Loading en App.tsx

```typescript
const PaymentPage = lazy(() => import('./components/PaymentPage'))
const SecureDashboard = lazy(() => import('./components/SecureDashboard'))
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'))

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="mt-4 text-sm">Cargando...</p>
  </div>
)

// En renderFormStep()
{currentStep === AppStep.Payment && (
  <Suspense fallback={<LoadingFallback />}>
    <PaymentPage formData={formData} updateFormData={updateFormData} />
  </Suspense>
)}
```

### LocalStorage con Versionado

```typescript
const STORAGE_VERSION = 'v7'
const STORAGE_KEY_AUTHENTICATED = (uid: string) => `sbs_form_${STORAGE_VERSION}_user_${uid}`
const STORAGE_KEY_GUEST = `sbs_form_${STORAGE_VERSION}_guest`

// En App.tsx useEffect
useEffect(() => {
  const key = user ? STORAGE_KEY_AUTHENTICATED(user.uid) : STORAGE_KEY_GUEST
  const stored = localStorage.getItem(key)
  
  if (stored) {
    try {
      const data = JSON.parse(stored)
      setFormData(data.formData)
      setCurrentStep(data.currentStep)
    } catch (e) {
      // Si v7 se corrompe, puede migrar a v8 aquí
      console.error('Corrupt localStorage, resetting...')
    }
  }
}, [user])

// Guardar en localStorage
useEffect(() => {
  const key = user ? STORAGE_KEY_AUTHENTICATED(user.uid) : STORAGE_KEY_GUEST
  localStorage.setItem(key, JSON.stringify({
    formData,
    currentStep
  }))
}, [formData, currentStep, user])
```

---

## 🚀 SERVICIOS Y APIS EXTERNAS

### Firebase Initialization (services/firebase.ts)

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
```

### Gemini AI Service (services/geminiService.ts)

```typescript
// Mejora objeto social (descripción de actividades)
export async function improveSocialObject(userInput: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = `
    Eres experto en redacción legal dominicana. 
    El usuario describe actividades: "${userInput}"
    
    Redacta un "objeto social" formal conforme a Ley 479-08 (RD).
    Respeta actividades declaradas, no agregues automáticamente sectores.
    Devuelve SOLO el texto del objeto social, sin explicaciones.
  `
  
  try {
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    return userInput // Fallback: devuelve input si falla
  }
}

// Verifica recibo de pago (análisis de imagen)
export async function verifyPaymentReceipt(file: File, expectedAmount: number) {
  const base64 = await fileToBase64(file)
  const prompt = `
    Analiza esta imagen de transferencia bancaria.
    ¿Parece un documento legítimo?
    Tolera baja calidad (borroso, foto de pantalla).
    Responde: { isValid: boolean, message: string }
  `
  
  // Llamada a Gemini con visión
  // Devuelve validación preliminar
}
```

### Document Service (services/documentService.ts)

```typescript
// Guardar aplicación completa
export async function saveFullApplication(data: FormData) {
  // 1. Upload all File objects a Cloud Storage
  const uploadedLogo = await uploadFile(data.logoFile, '/logos')
  const uploadedIdFront = await uploadFile(data.partners[0].idFront, '/identidades')
  // ... etc para todos los files
  
  // 2. Reemplazar Files con URLs
  const serialized = {
    ...data,
    logoFile: uploadedLogo,
    partners: data.partners.map(p => ({
      ...p,
      idFront: uploadedIdFront,
      idBack: uploadedIdBack
    }))
  }
  
  // 3. POST a servidor
  const response = await fetch('/api/procesar-solicitud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
      ...serialized
    })
  })
  
  // 4. Servidor guarda en Firestore
  // 5. Cloud Function dispara onVentaCreate
}

// Vincular venta huérfana a usuario
export async function linkSaleToUser(saleId: string, userId: string) {
  const saleRef = doc(db, 'ventas', saleId)
  await updateDoc(saleRef, {
    userId: userId,
    linkedAt: serverTimestamp(),
    status: 'vinculado'
  })
}
```

---

## 📊 PAQUETES Y PRECIOS

Definidos en `constants.ts`:

```typescript
const PACKAGES = {
  'Starter Pro': {
    price: 27_900,  // RD$
    features: [
      'Firma Digital (1 año)',
      'Nombre Comercial',
      'Documentos legales',
      'Trámite ONAPI',
      'Registro Mercantil',
      'RNC',
      'DGII (Régimen Normal)',
      'Contabilidad básica',
      'Soporte técnico'
    ],
    includesBankLetter: false
  },
  'Essential 360': {
    price: 41_900,  // RD$
    features: [...],
    bonuses: ['Sello Gomígrafo', 'Plantilla Facturas', 'SIRLA/SUIR'],
    includesBankLetter: true
  },
  'Unlimitech': {
    price: 64_900,  // RD$
    features: [...],
    bonuses: ['Sello Gomígrafo', 'Dominio 2 años', '5 Correos', 'Asesoría Fiscal'],
    includesBankLetter: true
  }
}
```

### ICC Tax Calculation

```typescript
function calculateICCTax(socialCapital: number): number {
  if (socialCapital > 100_000) {
    return (socialCapital - 100_000) * 0.01
  }
  return 0
}

// Ejemplo:
// Capital 100,000 → ICC = 0
// Capital 200,000 → ICC = 1,000
// Capital 500,000 → ICC = 4,000
```

---

## 🔧 VARIABLES DE ENTORNO REQUERIDAS

### Frontend (.env.local)

```bash
# Firebase (VITE_* se embeben en build)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=sbservicesrd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sbservicesrd
VITE_FIREBASE_STORAGE_BUCKET=sbservicesrd.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=334529632725
VITE_FIREBASE_APP_ID=1:334529632725:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-N36DNMB9RF

# APIs (públicas, seguras embeber)
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend (server.cjs Runtime)

```bash
# Servidor
PORT=8080

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# APIs
GOOGLE_API_KEY=...
GEMINI_API_KEY=...
PAYPAL_CLIENT_ID=...

# Email
ZOHO_PASSWORD=...  # Para Gmail SMTP via nodemailer
```

---

## 🏃 CÓMO EJECUTAR EL PROYECTO

### Desarrollo

```bash
# Instalar dependencias
npm install

# Validar variables de entorno
npm run build  # Falla si faltan VITE_* obligatorias

# Dev server (Vite)
npm run dev    # http://localhost:5173

# Cloud Functions (en carpeta /functions)
firebase emulator:start --import=./emulators
# O deploy a producción:
firebase deploy --only functions
```

### Producción

```bash
# Build optimizado
npm run build  # Crea /dist

# Previsualizar build
npm run preview

# Servidor Express
npm run start  # Lee /dist, sirve en :8080 con SPA rewrite
```

### Deployment

```bash
# Opción 1: Vercel (recomendado)
vercel              # Detecta Next/Vite, deploya automáticamente
vercel --prod       # A producción

# Opción 2: Firebase Hosting
firebase deploy --only hosting

# Opción 3: Node.js tradicional (server.cjs)
npm run start       # Ejecuta Express en :8080
```

---

## 🐛 COMMON ISSUES Y SOLUCIONES

### "Build failed: VITE_FIREBASE_API_KEY is missing"

**Causa:** `.env.local` no tiene variable requerida  
**Solución:** 
```bash
# Verifica .env.local tiene todas las VITE_* variables
cat .env.local

# O copia template
cp .env.example .env.local
# y llena valores
```

### "TypeError: Cannot read property 'uid' of null"

**Causa:** Intenta acceder a `auth.currentUser.uid` sin verificar autenticación  
**Solución:**
```typescript
if (auth.currentUser) {
  const uid = auth.currentUser.uid
} else {
  // Usuario no autenticado
}
// O en componentes:
if (!user) return <LoginPage />
```

### "Firestore: Missing or insufficient permissions"

**Causa:** Security rules bloquean lectura/escritura  
**Solución:**
```bash
# Verifica firestore.rules
cat firestore.rules

# En desarrollo (permite todo):
match /{document=**} {
  allow read, write: if request.auth != null;
}

# En producción (más restrictivo):
# Ver CLAUDE.md para detalles
```

### "Upload failed: File too large"

**Causa:** File > límite Cloud Storage  
**Solución:**
```typescript
// Validar client-side
if (file.size > 5_000_000) {  // 5 MB
  alert('Archivo muy grande (máx 5 MB)')
  return
}

// Servidor valida también
```

### "Email de confirmación no llega"

**Causa:** Cloud Function falla, Gmail SMTP mal configurado  
**Solución:**
```bash
# Ver logs
firebase functions:log
firebase functions:log --only onVentaCreate

# Verifica ZOHO_PASSWORD
firebase functions:config:get | grep zoho

# Si falta:
firebase functions:config:set zoho.password="..."
firebase deploy --only functions
```

---

## 📈 MÉTRICAS Y PERFORMANCE

### Web Vitals

| Métrica | Actual | Target |
|---------|--------|--------|
| **LCP** (Largest Contentful Paint) | ~2.5s | <2.5s |
| **FID** (First Input Delay) | ~100ms | <100ms |
| **CLS** (Cumulative Layout Shift) | 0.1 | <0.1 |
| **Bundle Size (gzip)** | ~230 KB | <150 KB |

### Cómo Mejorar Bundle Size

```bash
# Analizar bundle
npm run build
npx vite-bundle-visualizer dist

# Tree-shake Lucide icons (solo usados)
// En lugar de:
import * as Icons from 'lucide-react'
// Usar:
import { Check, X, AlertCircle } from 'lucide-react'

# Auditar dependencias
npm audit

# Considerar alternativas más ligeras:
// redux-toolkit (90 KB) → zustand (2 KB)
// axios (14 KB) → fetch API
```

---

## 🎓 PATRONES Y CONVENCIONES

### Tipos TypeScript

```typescript
// Siempre strict mode
// tsconfig.json: "strict": true

// Evita 'any'
function handleChange(field: string, value: any) {  // ❌ MAL
  // ...
}

function handleChange<T extends keyof FormData>(field: T, value: FormData[T]) {  // ✅ BIEN
  // ...
}
```

### Nombres de Variables

```typescript
// ✅ BIEN: descriptivo, verbo en imperativo
const saveApplication = () => { }
const handlePaymentSuccess = () => { }
const formatCurrency = (amount: number) => { }

// ❌ MAL: ambiguo, abreviaciones
const save = () => { }
const process = () => { }
const fmt = () => { }
```

### Componentes Funcionales

```typescript
// ✅ BIEN: props destructuradas, tipos claros
interface StepAProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  nextStep: () => void
  prevStep: () => void
}

const StepA: React.FC<StepAProps> = ({
  formData,
  updateFormData,
  nextStep,
  prevStep
}) => {
  // ...
}

// ❌ MAL: props sin tipado, lógica sucia
const StepA = (props) => {
  // ...
}
```

---

## 🚦 PRÓXIMOS PASOS RECOMENDADOS

### Críticos (URGENTE: 1-2 semanas)

1. **Implementar Test Suite**
   - Vitest + Playwright
   - Cobertura ≥70% rutas críticas
   - Focus: wizard, pago, auth

2. **Agregar File Size Validation**
   - Client: max 5 MB
   - Servidor: rechazar > 5 MB
   - Prevenir DoS

3. **Integrar Sentry**
   - Track errors en pago
   - Alertas en crashes

### Importantes (2-4 semanas)

4. **Refactor StepA/B**
   - De 66-77 KB → sub-componentes
   - Mejorar mantenibilidad

5. **Admin Dashboard**
   - Vista de transferencias pendientes
   - Aprobar/rechazar manualmente
   - Actualizar status del expediente

6. **Real-time Dashboard**
   - Firestore listeners en DashboardPage
   - Live updates del status
   - Push notifications

### Nice-to-Have (1-2 meses)

7. **SAS Completamente**
   - Terminar lógica
   - Habilitar en StepTypeSelection

8. **Chatbot Funcional**
   - Fine-tune Gemini con FAQ
   - Integrar con chat widget

9. **Encriptación Client-side**
   - TweetNaCl.js para localStorage

10. **GDPR + Audit Trail**
    - Registrar cambios
    - Cumplimiento normativo

---

## 📞 RECURSOS Y REFERENCIAS

### Documentación Oficial

- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)

### En el Proyecto

- `CLAUDE.md` — Arquitectura del proyecto
- `types.ts` — Todas las interfaces
- `constants.ts` — Datos maestros
- `vite.config.ts` — Config build
- `tailwind.config.js` — Estilos
- `vercel.json` — Security headers + rewrites
- `firestore.rules` — Firestore security
- `functions/index.js` — Cloud Functions

---

## ✅ CHECKLIST PARA PROMPTING A CLAUDE

Cuando hagas tareas en el proyecto, incluye:

- [ ] **Objetivo claro:** ¿Qué quieres lograr?
- [ ] **Archivo(s) a modificar:** Rutas exactas
- [ ] **Tipo de cambio:** Nueva feature, bug fix, refactor, etc.
- [ ] **Criterio de aceptación:** ¿Cómo sé que terminó?
- [ ] **Contexto:** Referencia este documento si es necesario
- [ ] **Dependencias:** ¿Afecta otros componentes?

**Ejemplo de buen prompt:**

> Necesito **refactorizar StepB.tsx** (línea 77 KB) dividiéndolo en sub-componentes:
> - `PartnersListComponent.tsx` — lista editable de socios
> - `PartnerFormModal.tsx` — modal para agregar/editar
> - `ShareDistributionComponent.tsx` — cálculo de acciones
> 
> **Archivos a modificar:** `/src/components/StepB.tsx`, `/src/components/*` (nuevos)
> 
> **Criterio:** Mismo comportamiento, código más mantenible, bundle size igual o menor
> 
> **Impacto:** App.tsx props drilling sin cambios, tests nuevos para subcomponentes

---

**Documento generado:** 2026-05-02  
**Versión:** 1.0  
**Última revisión:** Manual completo + guía de referencia
