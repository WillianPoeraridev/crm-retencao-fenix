-- Multi-tenant foundation (Fase 1) — retenção.
-- Adiciona tenantId (backfill -> fenix) e troca uniques por compostas.
-- NÃO toca o schema `shared` (Tenant/Customer são do app comercial).
-- Deve rodar DEPOIS do migrate do comercial (que cria shared.Tenant + 'fenix').

-- ===================== retencao.User =====================
ALTER TABLE "retencao"."User" ADD COLUMN "tenantId" TEXT;
UPDATE "retencao"."User" SET "tenantId" = 'fenix';
ALTER TABLE "retencao"."User" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX "retencao"."User_email_key";
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "retencao"."User"("tenantId", "email");
CREATE INDEX "User_tenantId_idx" ON "retencao"."User"("tenantId");

-- ===================== retencao.Cidade =====================
ALTER TABLE "retencao"."Cidade" ADD COLUMN "tenantId" TEXT;
UPDATE "retencao"."Cidade" SET "tenantId" = 'fenix';
ALTER TABLE "retencao"."Cidade" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Cidade_tenantId_idx" ON "retencao"."Cidade"("tenantId");

-- ===================== retencao.Competencia =====================
ALTER TABLE "retencao"."Competencia" ADD COLUMN "tenantId" TEXT;
UPDATE "retencao"."Competencia" SET "tenantId" = 'fenix';
ALTER TABLE "retencao"."Competencia" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX "retencao"."Competencia_ano_mes_key";
CREATE UNIQUE INDEX "Competencia_tenantId_ano_mes_key" ON "retencao"."Competencia"("tenantId", "ano", "mes");
CREATE INDEX "Competencia_tenantId_idx" ON "retencao"."Competencia"("tenantId");

-- ===================== retencao.SolicitacaoRetencao =====================
ALTER TABLE "retencao"."SolicitacaoRetencao" ADD COLUMN "tenantId" TEXT;
UPDATE "retencao"."SolicitacaoRetencao" SET "tenantId" = 'fenix';
ALTER TABLE "retencao"."SolicitacaoRetencao" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "SolicitacaoRetencao_tenantId_idx" ON "retencao"."SolicitacaoRetencao"("tenantId");
