# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server
npm run dev

# Production build (validates env vars first via scripts/validate-vite-env.cjs)
npm run build

# Preview production build
npm run preview

# Run production server (Express)
npm run start
```

There is no test suite configured.

### Firebase Functions (in `/functions`)

```bash
firebase deploy --only functions
firebase functions:log
firebase functions:log --only onVentaCreate
```

## Environment Variables

The build will fail if any of these are missing:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID  # optional
```

Place them in `.env` or `.env.local` for local development.

## Architecture

This is a single-page React 19 + TypeScript + Vite application for online company registration in the Dominican Republic.

### Application Flow

The app is a multi-step wizard. All state lives in `App.tsx` and is persisted to `localStorage` under the key `sbs_form_v7_user_{uid}` (authenticated) or `sbs_form_v7_guest`.

Step order (defined in `types.ts` as `AppStep` enum):

```
Landing → StepTypeSelection → StepA → StepB → StepC → Summary → Payment
→ PostPaymentWelcome → PostPaymentForm → Success → Dashboard
```

Page-level navigation (legal pages, login) is handled separately via a `PageView` type (`'main' | 'privacy' | 'terms' | 'refund' | 'login'`) alongside the wizard steps.

### Key Files

| File | Purpose |
|---|---|
| `App.tsx` | Root component; owns all state (`formData`, `currentStep`, `user`), step transitions, and localStorage persistence |
| `types.ts` | All TypeScript types — `FormData`, `AppStep` enum, `Partner`, `Applicant`, `CompanyType`, etc. |
| `constants.ts` | Packages, provinces, municipalities, NCF options, countries, postal code config |
| `services/firebase.ts` | Firebase initialization (Auth, Firestore, Storage, Analytics) |
| `services/documentService.ts` | PDF/document generation logic |
| `services/geminiService.ts` | Google Gemini AI integration |
| `services/chatService.ts` | Chatbot service |
| `utils/calculations.ts` | Financial calculations (currency formatting, share/capital math) |
| `utils/validation.ts` | Form validation helpers |
| `functions/index.js` | Firebase Cloud Functions: `onVentaCreate` (generates orderId, sends email) and `onVentaUpdate` (sends status-change email) |

### Company Types

Currently supported: `SRL` (S.R.L.) and `EIRL` (E.I.R.L.).
Coming soon: `SAS`, S.A., and others — shown as disabled options in `StepTypeSelection`.

### Packages

Three service tiers defined in `constants.ts` and used throughout:
- `Starter Pro` — 27,900 DOP
- `Essential 360` — 41,900 DOP
- `Unlimitech` — 64,900 DOP

### Firebase / Backend

- **Firestore database**: Always use `formalizate-app-prod` — never the default database.
- **Cloud Functions** (`functions/index.js`): Node.js 22, region `us-central1`. Email is sent via Gmail SMTP using `ZOHO_PASSWORD` env var. Set it with `firebase functions:config:set zoho.password="..."`.
- **Auth**: Google provider via `firebase/auth`.

### Styling

Tailwind CSS with custom design tokens in `tailwind.config.js`:
- `sbs-blue`: `#1D3557` (primary brand color)
- `sbs-red`: `#E63A47` (CTA / accent)
- `animate-fade-in-up`: standard entry animation for step components

### Lazy-loaded Components

`PaymentPage`, `SecureDashboard`, `TermsOfServicePage`, `PrivacyPolicyPage`, and `RefundPolicyPage` are lazy-loaded via `React.lazy`.

### Vite Build Chunking

`vite.config.ts` splits vendor bundles: `vendor-firebase`, `vendor-react`, `vendor-ui` to avoid circular reference issues with Firebase.
