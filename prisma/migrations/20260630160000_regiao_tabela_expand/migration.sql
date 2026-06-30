-- Fase 2 (expand) — retenção: Região enum -> tabela configurável por tenant.
-- ADITIVO: regiaoId (FK) ao lado do enum (renomeado RegiaoEnum). Roda DEPOIS do
-- migrate de foundation do retenção (tenantId já existe).

-- 1. Renomeia o enum + torna a coluna opcional
ALTER TYPE "retencao"."Regiao" RENAME TO "RegiaoEnum";
ALTER TABLE "retencao"."SolicitacaoRetencao" ALTER COLUMN "regiao" DROP NOT NULL;

-- 2. Tabela Regiao
CREATE TABLE "retencao"."Regiao" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "cor" TEXT,
  "isForaArea" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Regiao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Regiao_tenantId_nome_key" ON "retencao"."Regiao"("tenantId", "nome");
CREATE INDEX "Regiao_tenantId_idx" ON "retencao"."Regiao"("tenantId");

-- 3. regiaoId + FK + índice
ALTER TABLE "retencao"."SolicitacaoRetencao" ADD COLUMN "regiaoId" TEXT;
CREATE INDEX "SolicitacaoRetencao_regiaoId_idx" ON "retencao"."SolicitacaoRetencao"("regiaoId");
ALTER TABLE "retencao"."SolicitacaoRetencao" ADD CONSTRAINT "SolicitacaoRetencao_regiaoId_fkey" FOREIGN KEY ("regiaoId") REFERENCES "retencao"."Regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Semeia as regiões por tenant (a partir do enum)
INSERT INTO "retencao"."Regiao" ("id", "tenantId", "nome", "ordem", "cor", "updatedAt")
SELECT gen_random_uuid()::text, t."id", r.nome, r.ordem, r.cor, now()
FROM "shared"."Tenant" t
CROSS JOIN (VALUES
  ('Matriz', 0, 'var(--accent)'),
  ('Sinos', 1, 'var(--violet)'),
  ('Litoral', 2, 'var(--info)')
) AS r(nome, ordem, cor);

-- 5. Backfill regiaoId a partir do enum
UPDATE "retencao"."SolicitacaoRetencao" s SET "regiaoId" = r."id"
FROM "retencao"."Regiao" r
WHERE r."tenantId" = s."tenantId" AND s."regiao" IS NOT NULL
  AND r."nome" = CASE s."regiao"::text
    WHEN 'MATRIZ' THEN 'Matriz' WHEN 'SINOS' THEN 'Sinos' WHEN 'LITORAL' THEN 'Litoral' END;
