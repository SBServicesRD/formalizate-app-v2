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


## Venta-nace-al-pagar (borradores) — COREOGRAFÍA DE DESPLIEGUE

Construido y probado local 2026-07-17; AÚN NO SERVIDO. El orden importa:

1. **Functions primero** (`firebase deploy --only functions`). Es retro-compatible:
   el wizard viejo nunca crea `status: 'borrador'`, así que la rama nueva de
   `onVentaCreate` y el trigger `onExpedienteCompletado` quedan dormidos hasta
   que el wizard nuevo entre.
2. **Secreto al servicio Cloud Run**: el wizard verifica los tokens de
   reanudación con el MISMO secreto del dashboard de clientes:
   `gcloud run deploy formalizate-wizard ... --set-secrets CUSTOMER_MAGIC_SECRET=CUSTOMER_MAGIC_SECRET:latest`
   (sin la variable, /api/reanudar y el autoguardado responden 503; el resto
   del wizard funciona).
3. **Canary del wizard**: `gcloud run deploy formalizate-wizard --source . --no-traffic --tag <tag>`
   → probar compra real en la URL del canary (transferencia: el comprobante
   sube AL PAGAR; debe llegar el correo "continúa tu expediente" con PIN; el
   enlace ?continuar= debe reanudar) → promover tráfico.
4. **Después de promover**: revisar que el admin-dashboard muestre dignamente
   las ventas `status: 'borrador'` (pagos sin expediente completado) — son
   ventas REALES pendientes de seguimiento, no basura.

Rollback: `gcloud run services update-traffic formalizate-wizard --to-revisions <revision-previa>=100`.
Las functions nuevas no necesitan rollback (dormidas sin wizard nuevo).
