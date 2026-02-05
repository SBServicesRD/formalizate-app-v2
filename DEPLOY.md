# 🚀 Despliegue de Cloud Functions

## Comandos Requeridos

```bash
# 1. Autenticarse
firebase login

# 2. Configurar contraseña de Zoho
firebase functions:config:set zoho.password="TU_PASSWORD"

# 3. (Opcional) Configurar URL del dashboard
firebase functions:config:set app.dashboard_url="https://formalizate.app/dashboard"

# 4. Desplegar
firebase deploy --only functions
```

## Verificar

```bash
# Ver logs
firebase functions:log

# Ver logs de función específica
firebase functions:log --only onVentaCreate
```

## Funciones Desplegadas

- `onVentaCreate` - Genera orderId y envía correo al crear venta
- `onVentaUpdate` - Envía correo cuando cambia el status

## Notas

- BD: `formalizate-app-prod` (nunca "default")
- Correos desde: `ventas@formalizate.app`
- BCC automático: `jmestrella@formalizate.app`

