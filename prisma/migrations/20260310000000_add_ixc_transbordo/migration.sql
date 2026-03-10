-- AlterTable: adiciona registradoIXC e transbordo em SolicitacaoRetencao
ALTER TABLE "SolicitacaoRetencao" ADD COLUMN "registradoIXC" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SolicitacaoRetencao" ADD COLUMN "transbordo" TEXT;
