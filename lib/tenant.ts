import { prisma } from "./prisma";
import { tenantSlugFromHost } from "./tenant-host";

// Re-export para quem já importava daqui.
export { tenantSlugFromHost } from "./tenant-host";

/** Resolve o tenant ativo pelo slug. Retorna null se não existir ou estiver inativo. */
export async function resolveTenantBySlug(slug: string) {
  if (!slug) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) return null;
  return tenant;
}

/** Resolve o tenant ativo direto do host. */
export async function resolveTenantFromHost(host: string | null | undefined) {
  return resolveTenantBySlug(tenantSlugFromHost(host));
}
