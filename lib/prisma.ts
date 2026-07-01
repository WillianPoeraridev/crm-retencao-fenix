import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// No cutover, o runtime conecta como `app_runtime` (NOBYPASSRLS) via
// RUNTIME_DATABASE_URL — sem isso a RLS é teatro (postgres tem BYPASSRLS).
const connectionString =
  process.env.RUNTIME_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Faltando RUNTIME_DATABASE_URL/DIRECT_URL/DATABASE_URL no .env");
}

// Liga a fiação de RLS: cada query roda numa transação que seta `app.tenant_id`
// (SET LOCAL via set_config) pras policies engatarem sob o pooler. Desligado por
// padrão → comportamento atual (app-layer). Ligado no cutover com app_runtime.
const RLS_ENABLED = process.env.RLS_ENABLED === "true";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pgPool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
  });

const adapter = new PrismaPg(pgPool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pgPool;
}

// Models que NÃO têm coluna tenantId (não escopados pelo withTenant).
const MODELS_SEM_TENANT = new Set(["Tenant"]);

/**
 * Cliente Prisma escopado a um tenant. Injeta `tenantId` automaticamente em toda
 * query (where nas leituras/updates/deletes; data nos creates). Camada PRIMÁRIA
 * de isolamento; RLS entra depois como defesa em profundidade.
 *
 * Uso: `const db = withTenant(session.user.tenantId); await db.solicitacaoRetencao.findMany();`
 */
export function withTenant(tenantId: string) {
  if (!tenantId) throw new Error("[withTenant] tenantId obrigatório");

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model && MODELS_SEM_TENANT.has(model)) return query(args);

          const a = args as { where?: Record<string, unknown>; data?: unknown; create?: unknown };

          switch (operation) {
            case "create":
              a.data = { ...(a.data as Record<string, unknown>), tenantId };
              break;
            case "createMany":
            case "createManyAndReturn":
              a.data = Array.isArray(a.data)
                ? a.data.map((d) => ({ ...(d as Record<string, unknown>), tenantId }))
                : { ...(a.data as Record<string, unknown>), tenantId };
              break;
            case "upsert":
              a.where = { ...a.where, tenantId };
              a.create = { ...(a.create as Record<string, unknown>), tenantId };
              break;
            case "findUnique":
            case "findUniqueOrThrow":
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "update":
            case "updateMany":
            case "updateManyAndReturn":
            case "delete":
            case "deleteMany":
            case "count":
            case "aggregate":
            case "groupBy":
              a.where = { ...a.where, tenantId };
              break;
          }

          if (!RLS_ENABLED) return query(a);

          // RLS: seta o GUC e roda a query na MESMA transação (batch), pra o
          // set_config valer sob pgBouncer transaction-mode. `prisma` é o client
          // base (o $executeRaw não é op de model → não recorre na extensão).
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
            query(a),
          ]);
          return result;
        },
      },
    },
  });
}

/** Cliente Prisma escopado, derivado de withTenant — use como tipo de parâmetro. */
export type TenantDb = ReturnType<typeof withTenant>;
