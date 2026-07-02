-- Cidade.id deixa de ser PK GLOBAL e passa a PK COMPOSTA [tenantId, id].
-- Sem isso, dois tenants não podem ter o mesmo código de cidade.
-- Cidade está vazia (reset) → DDL puro. FK de SolicitacaoRetencao vira composta
-- (o campo FK é "cidade"; SolicitacaoRetencao já tem tenantId).

ALTER TABLE "retencao"."SolicitacaoRetencao" DROP CONSTRAINT "SolicitacaoRetencao_cidade_fkey";

ALTER TABLE "retencao"."Cidade" DROP CONSTRAINT "Cidade_pkey";
ALTER TABLE "retencao"."Cidade" ADD CONSTRAINT "Cidade_pkey" PRIMARY KEY ("tenantId", "id");

DROP INDEX IF EXISTS "retencao"."Cidade_tenantId_idx";

ALTER TABLE "retencao"."SolicitacaoRetencao"
  ADD CONSTRAINT "SolicitacaoRetencao_tenantId_cidade_fkey"
  FOREIGN KEY ("tenantId", "cidade") REFERENCES "retencao"."Cidade"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
