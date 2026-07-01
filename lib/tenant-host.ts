// Helpers de host/tenant PUROS (sem Prisma, sem deps de node) — seguros pro
// middleware (edge runtime). A resolução no banco fica em lib/tenant.ts.

const RESERVED = new Set(["www", "admin", "comercial", "retencao", "app", "api"]);
const DEV_FALLBACK_SLUG = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG || "wp-fibra";
export const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "crm-operacional.com.br";

/**
 * Extrai o slug do tenant a partir do host. Em prod o tenant é o 1º label do
 * subdomínio (ex: `wp-fibra.retencao.crm-operacional.com.br` → "wp-fibra"). Em dev
 * (localhost / sem subdomínio) usa NEXT_PUBLIC_DEV_TENANT_SLUG (default "wp-fibra").
 * Retorna "" quando não há slug válido em produção.
 */
export function tenantSlugFromHost(host: string | null | undefined): string {
  const hostname = (host ?? "").split(":")[0].toLowerCase();

  if (process.env.NODE_ENV !== "production") {
    const first = hostname.split(".")[0];
    if (!first || hostname.startsWith("localhost") || hostname.startsWith("127.") || RESERVED.has(first)) {
      return DEV_FALLBACK_SLUG;
    }
    return first;
  }

  const first = hostname.split(".")[0];
  if (!first || RESERVED.has(first)) return "";
  return first;
}

/** URL de login do portal central do tenant atual (deduzido do host). */
export function portalLoginUrl(host: string | null | undefined): string {
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DASHBOARD_URL) {
    return `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/login`;
  }
  const slug = tenantSlugFromHost(host);
  return `https://${slug}.${BASE_DOMAIN}/login`;
}
