import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Faltando DIRECT_URL (ou DATABASE_URL) no .env");
}

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
        $allOperations({ model, operation, args, query }) {
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

          return query(a);
        },
      },
    },
  });
}

/** Cliente Prisma escopado, derivado de withTenant — use como tipo de parâmetro. */
export type TenantDb = ReturnType<typeof withTenant>;
