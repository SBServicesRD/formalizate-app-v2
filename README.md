<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 Formalizate.app - Constituye tu Empresa

Plataforma digital para la constitución de empresas en República Dominicana.

## 📋 Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn
- Cuentas de servicios:
  - Firebase (para autenticación y base de datos)
  - Google Cloud (para Places API y Gemini AI)
  - PayPal (para pagos)

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

**⚠️ IMPORTANTE:** La aplicación requiere variables de entorno para funcionar correctamente.

#### Opción A: Configuración Rápida

1. Crea un archivo `.env` en la raíz del proyecto
2. Copia el formato del archivo [ENV_SETUP.md](ENV_SETUP.md)
3. Completa con tus credenciales reales

#### Opción B: Configuración Detallada

Consulta el archivo **[ENV_SETUP.md](ENV_SETUP.md)** para instrucciones completas sobre:
- Cómo obtener cada credencial
- Dónde configurar cada variable
- Configuración para desarrollo y producción

### 3. Firebase Service Account (Backend)

Para desarrollo local, coloca tu archivo `serviceAccountKey.json` en la raíz del proyecto.

Para producción, configura la variable `FIREBASE_SERVICE_ACCOUNT` con el JSON completo como string.

### 4. Ejecutar en Desarrollo

```bash
# Terminal 1: Servidor Backend
node server.cjs

# Terminal 2: Frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

### 5. Build para Producción

```bash
npm run build
```

Esto genera la carpeta `dist/` con los archivos optimizados.

---

## 📁 Estructura del Proyecto

```
formalizate.app/
├── components/          # Componentes React
├── services/            # Servicios (Firebase, Gemini, etc.)
├── utils/               # Utilidades (validación, cálculos)
├── server.cjs           # Servidor Express (Backend)
├── .env                 # Variables de entorno (NO subir a Git)
└── ENV_SETUP.md         # Documentación de variables de entorno
```

---

## 🔐 Variables de Entorno Requeridas

### Backend (server.cjs)
- `FIREBASE_SERVICE_ACCOUNT` - JSON del service account de Firebase
- `GOOGLE_API_KEY` - API Key de Google Cloud (Places API)
- `GOOGLE_PLACE_ID` - Place ID de Google Business
- `GEMINI_API_KEY` - API Key de Google Gemini AI

### Frontend (Vite)
- `VITE_FIREBASE_API_KEY` - Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID` - Firebase App ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase Measurement ID
- `VITE_PAYPAL_CLIENT_ID` - PayPal Client ID

**📖 Ver [ENV_SETUP.md](ENV_SETUP.md) para detalles completos**

---

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo (Vite)
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza el build de producción

---

## 🔒 Seguridad

- ✅ Todas las credenciales están modularizadas en variables de entorno
- ✅ Rate limiting implementado con `express-rate-limit`
- ✅ Protección contra Prompt Injection y XSS
- ✅ Logs sanitizados (sin datos personales)
- ✅ Validación de inputs en frontend y backend

---

## 📚 Documentación Adicional

- [ENV_SETUP.md](ENV_SETUP.md) - Guía completa de configuración de variables de entorno
- [server.cjs](server.cjs) - Documentación del servidor backend

---

## 🐛 Solución de Problemas

### El servidor no inicia
- Verifica que todas las variables de entorno estén configuradas
- Revisa que `serviceAccountKey.json` exista (desarrollo) o `FIREBASE_SERVICE_ACCOUNT` esté configurado (producción)

### El frontend no se conecta a Firebase
- Verifica que todas las variables `VITE_FIREBASE_*` estén configuradas
- Revisa la consola del navegador para errores específicos

### El chatbot no funciona
- Verifica que `GEMINI_API_KEY` esté configurada
- Revisa los logs del servidor para errores de API

---

## 📄 Licencia

Privado - Todos los derechos reservados
