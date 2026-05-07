# 🔐 Configuración de Variables de Entorno

Este documento explica cómo configurar todas las variables de entorno necesarias para que la aplicación funcione correctamente.

## 📋 Índice

- [Variables de Backend (server.cjs)](#variables-de-backend-servercjs)
- [Variables de Frontend (Vite)](#variables-de-frontend-vite)
- [Configuración Local](#configuración-local)
- [Configuración en Producción](#configuración-en-producción)

---

## 🔧 Variables de Backend (server.cjs)

Estas variables se configuran en el servidor Node.js y **NO** se exponen al cliente.

### Firebase Service Account

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Nota:** 
- Para desarrollo local, puedes dejar esto vacío y usar el archivo `serviceAccountKey.json`
- Para producción en la nube (Google Cloud Run, etc.), configura esta variable con el JSON completo como string de una línea
- El JSON debe estar en una sola línea, sin saltos de línea

### Google Places API

```bash
GOOGLE_API_KEY=tu_api_key_de_google_cloud
GOOGLE_PLACE_ID=tu_place_id_de_google_business
```

**Cómo obtenerlas:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita la API de Places
3. Crea una API Key en "Credenciales"
4. Obtén tu Place ID desde [Google Business Profile](https://business.google.com/)

### Google Gemini AI

```bash
GEMINI_API_KEY=tu_api_key_de_gemini
```

**Cómo obtenerla:**
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API Key
3. Copia la clave generada

---

## 🎨 Variables de Frontend (Vite)

Estas variables se exponen al cliente (navegador) y deben tener el prefijo `VITE_`.

### Firebase Configuration

```bash
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

**Cómo obtenerlas:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Configuración del proyecto" (⚙️)
4. En "Tus aplicaciones", selecciona la app web
5. Copia los valores del objeto `firebaseConfig`

### PayPal

```bash
VITE_PAYPAL_CLIENT_ID=tu_paypal_client_id
```

**Cómo obtenerla:**
1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una aplicación
3. Copia el "Client ID" (no el Secret, ese es solo para backend)

---

## 💻 Configuración Local

### Paso 1: Crear archivo `.env`

En la raíz del proyecto, crea un archivo `.env`:

```bash
# Backend
FIREBASE_SERVICE_ACCOUNT=
GOOGLE_API_KEY=tu_api_key_aqui
GOOGLE_PLACE_ID=tu_place_id_aqui
GEMINI_API_KEY=tu_gemini_key_aqui

# Frontend
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
VITE_PAYPAL_CLIENT_ID=tu_paypal_client_id
```

### Paso 2: Completar con tus credenciales

Reemplaza todos los valores `tu_*_aqui` con tus credenciales reales.

### Paso 3: Verificar que `.env` esté en `.gitignore`

Asegúrate de que `.env` esté en tu `.gitignore` para no subir credenciales a Git.

### Paso 4: Reiniciar el servidor

Después de crear/actualizar `.env`, reinicia el servidor:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

---

## ☁️ Configuración en Producción

### Google Cloud Run

1. Ve a tu servicio en [Google Cloud Console](https://console.cloud.google.com/)
2. Edita el servicio
3. Ve a la pestaña "Variables y secretos"
4. Agrega cada variable de entorno:
   - `GOOGLE_API_KEY`
   - `GOOGLE_PLACE_ID`
   - `GEMINI_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT` (como string JSON de una línea)
5. Para variables de frontend (`VITE_*`), configúralas en el **build** de Cloud Run (no solo en runtime)

### Cloud Run con `--source` (Vite + Express)

Con `gcloud run deploy --source .`, Vite compila durante Cloud Build.  
Por eso, las variables `VITE_*` deben existir en **build-time**.

Usa dos archivos locales (NO subir a Git):

```bash
# build.env.yaml (solo variables VITE_*)
VITE_FIREBASE_API_KEY: "..."
VITE_FIREBASE_AUTH_DOMAIN: "..."
VITE_FIREBASE_PROJECT_ID: "..."
VITE_FIREBASE_STORAGE_BUCKET: "..."
VITE_FIREBASE_MESSAGING_SENDER_ID: "..."
VITE_FIREBASE_APP_ID: "..."
VITE_FIREBASE_MEASUREMENT_ID: "..."
VITE_PAYPAL_CLIENT_ID: "..."
```

```bash
# runtime.env.yaml (variables backend/runtime)
FIREBASE_SERVICE_ACCOUNT: '{"type":"service_account",...}'
GOOGLE_API_KEY: "..."
GOOGLE_PLACE_ID: "..."
GEMINI_API_KEY: "..."
```

Deploy recomendado:

```bash
gcloud run deploy formalizate-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --build-env-vars-file build.env.yaml \
  --env-vars-file runtime.env.yaml
```

### Vercel / Netlify

1. Ve a la configuración de tu proyecto
2. Agrega las variables de entorno en "Environment Variables"
3. **Importante:** Solo agrega las variables `VITE_*` para el frontend
4. Para el backend (si usas Vercel Serverless Functions), agrega también las variables sin `VITE_`

### Variables de Entorno en Build

Para Vite, las variables `VITE_*` se inyectan en tiempo de build. Asegúrate de configurarlas antes de ejecutar `npm run build`.

---

## ⚠️ Notas de Seguridad

1. **NUNCA** subas el archivo `.env` a Git
2. **NUNCA** commitees credenciales reales
3. Usa diferentes credenciales para desarrollo y producción
4. Rota las credenciales periódicamente
5. Usa secretos gestionados por tu plataforma de hosting cuando sea posible

---

## 🧪 Verificación

Después de configurar las variables, verifica que todo funcione:

1. **Backend:** El servidor debe iniciar sin errores
2. **Frontend:** La app debe cargar sin errores en la consola
3. **Firebase:** Debe poder autenticar usuarios
4. **Chatbot:** Debe responder a mensajes
5. **PayPal:** Debe mostrar el botón de pago

Si algo no funciona, revisa:
- Que las variables estén correctamente escritas (sin espacios extra)
- Que los valores no tengan comillas adicionales
- Que hayas reiniciado el servidor después de cambiar `.env`
- Los logs del servidor para errores específicos

---

## 📞 Soporte

Si tienes problemas con la configuración, revisa:
- Los logs del servidor (`server.cjs`)
- La consola del navegador (F12)
- Los mensajes de error específicos

