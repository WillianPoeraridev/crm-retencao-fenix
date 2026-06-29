import crypto from "crypto";

// SSO por "passe": token HMAC de curta duração, compartilhado entre os apps Fênix.
// Espelhado em crm-comercial-fenix/lib/sso.ts e fenix-dashboard/lib/sso.ts — manter sincronizado.
//
// Multi-tenant: o passe carrega tenantId + tenantSlug; o app de destino confere
// que o slug do passe bate com o subdomínio em que está sendo consumido.

const SECRET = process.env.SSO_SECRET ?? "";
const VALIDADE_MS = 60_000; // 1 minuto

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "crm-operacional.com.br";

export type AppName = "comercial" | "retencao" | "dashboard";

const DEV_URLS: Record<AppName, string | undefined> = {
  comercial: process.env.NEXT_PUBLIC_CRM_COMERCIAL_URL,
  retencao: process.env.NEXT_PUBLIC_CRM_RETENCAO_URL,
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL,
};

/** Monta a URL base de um app para um tenant. dashboard = `{slug}.BASE`; demais = `{slug}.{app}.BASE`. */
export function appUrl(app: AppName, slug: string): string {
  if (process.env.NODE_ENV !== "production" && DEV_URLS[app]) {
    return DEV_URLS[app] as string;
  }
  const prefix = app === "dashboard" ? "" : `${app}.`;
  return `https://${slug}.${prefix}${BASE_DOMAIN}`;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Valida que `to` aponta para um host de app conhecido (qualquer subdomínio de tenant). */
export function urlPermitida(to: string): boolean {
  let url: URL;
  try {
    url = new URL(to);
  } catch {
    return false;
  }
  if (process.env.NODE_ENV !== "production") {
    if (url.hostname === "localhost" || url.hostname.startsWith("127.")) return true;
  }
  if (url.protocol !== "https:") return false;
  const base = escapeRe(BASE_DOMAIN);
  const patterns = [
    new RegExp(`^[a-z0-9-]+\\.comercial\\.${base}$`),
    new RegExp(`^[a-z0-9-]+\\.retencao\\.${base}$`),
    new RegExp(`^[a-z0-9-]+\\.${base}$`),
  ];
  return patterns.some((re) => re.test(url.hostname));
}

export interface PassePayload {
  email: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  exp: number;
}

export function gerarPasse(email: string, name: string, tenantId: string, tenantSlug: string): string {
  const payload: PassePayload = { email, name, tenantId, tenantSlug, exp: Date.now() + VALIDADE_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function validarPasse(token: string | null): PassePayload | null {
  if (!SECRET || !token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const esperado = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as PassePayload;
    if (!payload.email || !payload.tenantId || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
