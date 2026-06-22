# Build determinista para Cloud Run.
# El frontend se compila ANTES, en local (npm run build -> dist/).
# Esta imagen solo instala deps de runtime y sirve el dist/ ya compilado vía server.cjs.
# Motivo: los buildpacks empacaban un dist/ viejo en caché; con Dockerfile el COPY
# del dist/ se invalida cuando cambia, así que siempre sirve el build fresco.
FROM node:22-slim
WORKDIR /app

# Solo dependencias de runtime (server.cjs). Las devDeps (vite, ts) no se necesitan
# porque el dist/ ya viene compilado.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Código del servidor + dist/ ya compilado
COPY . .

# Cloud Run inyecta PORT; server.cjs lo respeta.
CMD ["node", "server.cjs"]
