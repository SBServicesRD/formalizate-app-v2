Este folder contiene el código relacionado con el dashboard de inversionistas, aislado desde el proyecto principal.

Contenido principal:
- `components/InvestorsDashboard.tsx` (UI del dashboard)
- `components/InvestorLogin.tsx` (archivo vacío en el origen)
- `services/investorsService.ts` (cliente para Cloud Functions)
- `functions/investorsDashboard.functions.js` (endpoints de Cloud Functions)
- `functions/seedInvestorSales.js` (seed para ventas en emulator)
- `scripts/setInvestorClaims.cjs` (script para asignar claim por email)
- `scripts/setInvestorClaim.js` (script para asignar claim por UID)
- `utils/calculations.ts` (solo `formatCurrency`)
- `data/INVESTOR_DASHBOARD_EXAMPLE.json` (ejemplo de payload)

Notas rápidas:
- Variables usadas en Cloud Functions: `INVESTOR_MAGIC_SECRET`, `INVESTOR_ALLOWED_EMAILS`, `INVESTOR_ACTIVE_EMAILS`.
- Los scripts de claims esperan un `serviceAccountKey.json` en el mismo nivel que ellos (`Dashboard/serviceAccountKey.json`).

