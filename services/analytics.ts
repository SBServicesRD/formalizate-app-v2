export interface MarketingTouch {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    gclid?: string;
    landingPage?: string;
    referrer?: string;
}

export interface MarketingAttribution {
    firstTouch: MarketingTouch;
    lastTouch: MarketingTouch;
    leadId?: string;
    gaClientId?: string;
    gaSessionId?: string;
    capturedAt: string;
}

const GA_MEASUREMENT_ID = 'G-H5NN987LKF';
const ATTRIBUTION_COOKIE = 'formalizate_attribution_v1';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

type Gtag = (...args: unknown[]) => void;

const readCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    const value = document.cookie.split('; ').find((item) => item.startsWith(prefix));
    return value ? value.slice(prefix.length) : null;
};

const readStoredAttribution = (): Pick<MarketingAttribution, 'firstTouch' | 'lastTouch' | 'leadId'> | null => {
    const raw = readCookie(ATTRIBUTION_COOKIE);
    if (!raw) return null;
    try {
        return JSON.parse(decodeURIComponent(raw));
    } catch {
        return null;
    }
};

const safeReferrer = (): string | undefined => {
    if (typeof document === 'undefined' || !document.referrer) return undefined;
    try {
        const url = new URL(document.referrer);
        if (url.hostname === 'formalizate.app' || url.hostname.endsWith('.formalizate.app')) {
            return undefined;
        }
        return `${url.origin}${url.pathname}`.slice(0, 500);
    } catch {
        return undefined;
    }
};

const currentTouch = (): MarketingTouch => {
    const params = new URLSearchParams(window.location.search);
    const referrer = safeReferrer();
    let inferredSource: string | undefined;
    let inferredMedium: string | undefined;

    if (referrer) {
        try {
            const referrerHost = new URL(referrer).hostname;
            const isGoogle = /(^|\.)google\./i.test(referrerHost);
            inferredSource = isGoogle ? 'google' : referrerHost;
            inferredMedium = isGoogle ? 'organic' : 'referral';
        } catch {
            // Ignore malformed referrers.
        }
    }

    const landingPage = `${window.location.pathname}${params.get('plan') ? `?plan=${encodeURIComponent(params.get('plan')!)}` : ''}`;
    return {
        source: params.get('utm_source') || inferredSource,
        medium: params.get('utm_medium') || inferredMedium,
        campaign: params.get('utm_campaign') || undefined,
        term: params.get('utm_term') || undefined,
        content: params.get('utm_content') || undefined,
        gclid: params.get('gclid') || undefined,
        landingPage,
        referrer,
    };
};

const hasMarketingSignal = (touch: MarketingTouch): boolean => Boolean(
    touch.source || touch.medium || touch.campaign || touch.term || touch.content || touch.gclid
);

const writeAttributionCookie = (firstTouch: MarketingTouch, lastTouch: MarketingTouch, leadId?: string): void => {
    if (typeof document === 'undefined') return;
    const value = encodeURIComponent(JSON.stringify({ firstTouch, lastTouch, ...(leadId ? { leadId } : {}) }));
    document.cookie = `${ATTRIBUTION_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; Domain=.formalizate.app; SameSite=Lax`;
};

const getGtagValue = (gtag: Gtag, field: 'client_id' | 'session_id'): Promise<string | null> =>
    new Promise((resolve) => {
        let settled = false;
        const finish = (value: unknown) => {
            if (settled) return;
            settled = true;
            resolve(typeof value === 'string' || typeof value === 'number' ? String(value) : null);
        };
        const timeout = window.setTimeout(() => finish(null), 1_000);
        try {
            gtag('get', GA_MEASUREMENT_ID, field, (value: unknown) => {
                window.clearTimeout(timeout);
                finish(value);
            });
        } catch {
            window.clearTimeout(timeout);
            finish(null);
        }
    });

// ─── Leads por WhatsApp desde el wizard ──────────────────────────────────────
// El enlace del footer era el único CTA de WhatsApp sin instrumentar del
// ecosistema: no emitía `lead_whatsapp` ni pegaba la referencia, así que quien
// abandonaba el formulario y escribía por ahí entraba a Chatwoot sin origen.
// Misma cookie y mismo formato `FM1-<canal>-<sufijo>` que la landing y el blog,
// para que n8n lo lea igual y Notion reciba `Lead ID` + `Origen marketing`.

const clasificarCanal = (touch: MarketingTouch): string => {
    const source = String(touch.source || '').toLowerCase();
    const medium = String(touch.medium || '').toLowerCase();
    if (touch.gclid || medium === 'cpc' || (source === 'google' && medium !== 'organic')) return 'ADS';
    if (/organic/.test(medium) || source === 'google' || source === 'bing') return 'SEO';
    if (/chatgpt|gemini|copilot|perplexity/.test(source)) return 'GEO';
    if (/facebook|instagram|meta/.test(source) && /paid|cpc/.test(medium)) return 'META';
    if (/facebook|instagram|tiktok|social/.test(source)) return 'REDES';
    if (source && !/direct|none/.test(source)) return 'REF';
    return 'DIR';
};

export interface LeadContext {
    leadId: string;
    sourceCode: string;
}

// Reutiliza el leadId ya guardado en la cookie (el visitante pudo generarlo en
// la landing antes de saltar al wizard) para no partir en dos el mismo lead.
export const getLeadContext = (): LeadContext => {
    const stored = readStoredAttribution();
    // Si la cookie aún no tiene atribución (visitante que aterriza DIRECTO en el
    // wizard desde un anuncio, o clic anterior a que termine la captura async),
    // caemos a los parámetros de la URL actual. Sin esto un clic con gclid se
    // clasificaba como 'DIR' y perdíamos la venta para Google Ads.
    const touch = stored?.firstTouch || stored?.lastTouch || currentTouch();
    const sourceCode = clasificarCanal(touch);

    const existente = stored?.leadId;
    if (existente) return { leadId: existente, sourceCode };

    const suffix = (window.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`)
        .replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();
    const leadId = `FM1-${sourceCode}-${suffix}`;

    if (typeof document !== 'undefined') {
        const value = encodeURIComponent(JSON.stringify({ ...(stored || {}), leadId }));
        document.cookie = `${ATTRIBUTION_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; Domain=.formalizate.app; SameSite=Lax`;
    }
    return { leadId, sourceCode };
};

// Pega la referencia al texto del enlace wa.me y emite `lead_whatsapp`.
// Se llama en el onClick y muta el href ANTES de que el navegador lo siga.
export const trackWhatsAppLead = (link: HTMLAnchorElement, eventLabel: string): void => {
    if (typeof window === 'undefined') return;
    const context = getLeadContext();

    try {
        const url = new URL(link.href);
        const original = url.searchParams.get('text') || 'Hola, me interesa formalizar mi empresa';
        // Quitamos CUALQUIER referencia previa antes de pegar la actual. Comparar
        // contra el marcador nuevo no basta: si el leadId cambia entre dos clics
        // (cookie bloqueada, dominio distinto) el texto acumulaba dos referencias
        // y el cliente enviaba el mensaje con ambas.
        const limpio = original.replace(/\s*Referencia:\s*FM1-[A-Z0-9-]+/gi, '').trimEnd();
        url.searchParams.set('text', `${limpio}\n\nReferencia: ${context.leadId}`);
        link.href = url.toString();
    } catch {
        // Un href malformado no debe impedir que el clic siga su curso.
    }

    const gtag = (window as Window & { gtag?: Gtag }).gtag;
    const emit: Gtag = typeof gtag === 'function'
        ? gtag
        : (...args: unknown[]) => {
            const w = window as Window & { dataLayer?: unknown[] };
            (w.dataLayer = w.dataLayer || []).push(args);
        };
    emit('event', 'lead_whatsapp', {
        event_category: 'lead',
        event_label: eventLabel,
        transport_type: 'beacon',
        lead_id: context.leadId,
        attribution_source: context.sourceCode,
    });
};

export const captureMarketingAttribution = async (): Promise<MarketingAttribution | null> => {
    if (typeof window === 'undefined') return null;

    const current = currentTouch();
    const stored = readStoredAttribution();
    const firstTouch = stored?.firstTouch || current;
    const lastTouch = hasMarketingSignal(current) ? current : (stored?.lastTouch || firstTouch);
    if (hasMarketingSignal(current)) {
        writeAttributionCookie(firstTouch, lastTouch, stored?.leadId);
    }

    const gtag = (window as Window & { gtag?: Gtag }).gtag;
    const [gaClientId, gaSessionId] = typeof gtag === 'function'
        ? await Promise.all([getGtagValue(gtag, 'client_id'), getGtagValue(gtag, 'session_id')])
        : [null, null];

    return {
        firstTouch,
        lastTouch,
        ...(stored?.leadId ? { leadId: stored.leadId } : {}),
        ...(gaClientId ? { gaClientId } : {}),
        ...(gaSessionId ? { gaSessionId } : {}),
        capturedAt: new Date().toISOString(),
    };
};
