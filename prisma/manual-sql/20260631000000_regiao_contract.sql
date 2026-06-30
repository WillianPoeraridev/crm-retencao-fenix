-- ════════════════════════════════════════════════════════════════════════
-- CONTRACT — região (retenção). ⚠️ NÃO está na pasta migrations de propósito.
-- ════════════════════════════════════════════════════════════════════════
-- Rodar SÓ depois que o EXPAND (20260630160000) estiver aplicado em prod E o
-- código novo (regiaoId) verificado rodando. IRREVERSÍVEL: remove o enum
-- RegiaoEnum + a coluna SolicitacaoRetencao.regiao (já migrada para regiaoId).
--
-- Depois de rodar, remover do schema.prisma: enum RegiaoEnum e o campo
-- `regiao RegiaoEnum?`, e `prisma migrate resolve`.

ALTER TABLE "retencao"."SolicitacaoRetencao" DROP COLUMN IF EXISTS "regiao";

DROP TYPE IF EXISTS "retencao"."RegiaoEnum";
