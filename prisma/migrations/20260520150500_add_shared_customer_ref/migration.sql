-- shared.Customer já foi criado pela migration equivalente do CRM Comercial.
-- Esta migration apenas adiciona a referência (customerId + FK) em SolicitacaoRetencao.

-- AlterTable: customerId em SolicitacaoRetencao (nullable até backfill da Fase 5)
ALTER TABLE "retencao"."SolicitacaoRetencao" ADD COLUMN "customerId" TEXT;

-- CreateIndex: lookup rápido por customerId
CREATE INDEX "SolicitacaoRetencao_customerId_idx" ON "retencao"."SolicitacaoRetencao"("customerId");

-- AddForeignKey: SolicitacaoRetencao.customerId -> shared.Customer.id
ALTER TABLE "retencao"."SolicitacaoRetencao" ADD CONSTRAINT "SolicitacaoRetencao_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "shared"."Customer"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
