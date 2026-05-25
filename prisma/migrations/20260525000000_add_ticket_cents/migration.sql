-- Adiciona coluna ticketCents em SolicitacaoRetencao.
-- O campo já existia no schema.prisma desde o commit 0cc3ee4 (feat(retencao): add TICKET CLIENTE field)
-- mas nunca teve migration formal. Esta migration formaliza o estado do banco.

ALTER TABLE "retencao"."SolicitacaoRetencao" ADD COLUMN "ticketCents" INTEGER;
