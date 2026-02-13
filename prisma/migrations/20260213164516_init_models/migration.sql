-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ATENDENTE');

-- CreateEnum
CREATE TYPE "StatusRetencao" AS ENUM ('CANCELADO', 'RETIDO', 'INADIMPLENCIA');

-- CreateEnum
CREATE TYPE "Regiao" AS ENUM ('SINOS', 'LITORAL', 'MATRIZ');

-- CreateEnum
CREATE TYPE "MotivoCancelamento" AS ENUM ('INSATISFACAO_ATD', 'INSATISFACAO_SERVICO', 'MUDANCA_ENDERECO', 'MOTIVOS_PESSOAIS', 'TROCA_PROVEDOR', 'PROBLEMAS_FINANC', 'OUTROS');

-- CreateEnum
CREATE TYPE "Cidade" AS ENUM ('CACHOEIRINHA', 'GRAVATAI', 'TRAMANDAI', 'IMBE', 'CIDREIRA', 'OSORIO', 'SAO_LEOPOLDO', 'NOVO_HAMBURGO', 'IVOTI', 'TAQUARA', 'IGREJINHA', 'PAROBE', 'ESTANCIA_VELHA', 'DOIS_IRMAOS', 'CAMPO_BOM', 'SAPUCAIA', 'ESTEIO', 'CANOAS', 'PORTO_ALEGRE', 'VIAMAO', 'ALVORADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATENDENTE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competencia" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "metaCancelamentos" INTEGER,
    "orcamentoComissaoCents" INTEGER,
    "baseAtivosTotal" INTEGER,
    "inadimplenciaTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoRetencao" (
    "id" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "dataRegistro" TIMESTAMP(3) NOT NULL,
    "status" "StatusRetencao" NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "bairro" TEXT,
    "contato" TEXT,
    "cidade" "Cidade" NOT NULL,
    "regiao" "Regiao" NOT NULL,
    "agendaRetirada" TIMESTAMP(3),
    "retiradaTexto" TEXT,
    "atendenteId" TEXT NOT NULL,
    "motivo" "MotivoCancelamento",
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoRetencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE INDEX "Competencia_ano_mes_idx" ON "Competencia"("ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Competencia_ano_mes_key" ON "Competencia"("ano", "mes");

-- CreateIndex
CREATE INDEX "SolicitacaoRetencao_competenciaId_status_idx" ON "SolicitacaoRetencao"("competenciaId", "status");

-- CreateIndex
CREATE INDEX "SolicitacaoRetencao_competenciaId_motivo_idx" ON "SolicitacaoRetencao"("competenciaId", "motivo");

-- CreateIndex
CREATE INDEX "SolicitacaoRetencao_atendenteId_idx" ON "SolicitacaoRetencao"("atendenteId");

-- CreateIndex
CREATE INDEX "SolicitacaoRetencao_cidade_idx" ON "SolicitacaoRetencao"("cidade");

-- CreateIndex
CREATE INDEX "SolicitacaoRetencao_regiao_idx" ON "SolicitacaoRetencao"("regiao");

-- AddForeignKey
ALTER TABLE "SolicitacaoRetencao" ADD CONSTRAINT "SolicitacaoRetencao_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "Competencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoRetencao" ADD CONSTRAINT "SolicitacaoRetencao_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
