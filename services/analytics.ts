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
