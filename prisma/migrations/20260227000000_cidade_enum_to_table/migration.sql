-- 1. Libera a coluna do enum — converte pra TEXT puro
ALTER TABLE "SolicitacaoRetencao" ALTER COLUMN "cidade" TYPE TEXT USING "cidade"::TEXT;

-- 2. Agora que ninguém depende do enum, pode dropar
DROP TYPE "Cidade";

-- 3. Cria a tabela (nome livre agora)
CREATE TABLE "Cidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cidade_pkey" PRIMARY KEY ("id")
);

-- 4. Popula com as cidades existentes
INSERT INTO "Cidade" ("id", "nome") VALUES
('CACHOEIRINHA', 'Cachoeirinha'),
('GRAVATAI', 'Gravataí'),
('TRAMANDAI', 'Tramandaí'),
('IMBE', 'Imbé'),
('CIDREIRA', 'Cidreira'),
('OSORIO', 'Osório'),
('SAO_LEOPOLDO', 'São Leopoldo'),
('NOVO_HAMBURGO', 'Novo Hamburgo'),
('IVOTI', 'Ivoti'),
('TAQUARA', 'Taquara'),
('IGREJINHA', 'Igrejinha'),
('PAROBE', 'Parobé'),
('ESTANCIA_VELHA', 'Estância Velha'),
('DOIS_IRMAOS', 'Dois Irmãos'),
('CAMPO_BOM', 'Campo Bom'),
('SAPUCAIA', 'Sapucaia do Sul'),
('ESTEIO', 'Esteio'),
('CANOAS', 'Canoas'),
('PORTO_ALEGRE', 'Porto Alegre'),
('VIAMAO', 'Viamão'),
('ALVORADA', 'Alvorada');

-- 5. Agora sim, adiciona a FK
ALTER TABLE "SolicitacaoRetencao"
  ADD CONSTRAINT "SolicitacaoRetencao_cidade_fkey"
  FOREIGN KEY ("cidade") REFERENCES "Cidade"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;