import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, StatusRetencao, Regiao, MotivoCancelamento } from "@prisma/client";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Faltando ${name} no .env`);
  return v;
}

async function main() {
  const DIRECT_URL = mustEnv("DIRECT_URL");

  // Prisma 7: conexão via adapter
  const pool = new Pool({ connectionString: DIRECT_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Tenant dos dados da Fênix (slug = subdomínio). Idempotente entre os seeds.
  const TENANT_ID = "fenix";
  await prisma.tenant.upsert({
    where: { slug: TENANT_ID },
    update: {},
    create: { id: TENANT_ID, slug: TENANT_ID, nome: "Fênix Fibra" },
  });

  // Emails (vão no campo "email" do teu model atual)
  const ADMIN_EMAIL = "willianpoerari@fenixfibra.com.br";
  const ATENDENTE_EMAIL = "willianpoerarifx@gmail.com";

  const ADMIN_PASS = mustEnv("SEED_ADMIN_PASSWORD");
  const ATENDENTE_PASS = mustEnv("SEED_ATENDENTE_PASSWORD");

  // Hash
  const adminHash = await bcrypt.hash(ADMIN_PASS, 10);
  const atendenteHash = await bcrypt.hash(ATENDENTE_PASS, 10);

  // 1) Users — Admin
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: ADMIN_EMAIL } },
    update: {
      name: "Willian (Admin)",
      role: Role.ADMIN,
      passwordHash: adminHash,
      isActive: true,
    },
    create: {
      name: "Willian (Admin)",
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      role: Role.ADMIN,
      isActive: true,
      tenantId: TENANT_ID,
    },
  });

  // Atendentes — todos usam a mesma senha provisória do .env
  const atendentesData = [
    { name: "Willian P", email: ATENDENTE_EMAIL },
    { name: "José", email: "jose@fenixfibra.com.br" },
    { name: "Anderson", email: "anderson@fenixfibra.com.br" },
    { name: "Douglas", email: "douglas@fenixfibra.com.br" },
    { name: "Tiago", email: "tiago@fenixfibra.com.br" },
  ];

  const atendentes = [];
  for (const a of atendentesData) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: a.email } },
      update: {
        name: a.name,
        role: Role.ATENDENTE,
        passwordHash: atendenteHash,
        isActive: true,
      },
      create: {
        name: a.name,
        email: a.email,
        passwordHash: atendenteHash,
        role: Role.ATENDENTE,
        isActive: true,
        tenantId: TENANT_ID,
      },
    });
    atendentes.push(user);
  }

  const atendente = atendentes[0]; // Willian P — usado nos exemplos abaixo

  // 2) Competência (mês/ano atual)
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const competencia = await prisma.competencia.upsert({
    where: { tenantId_ano_mes: { tenantId: TENANT_ID, ano, mes } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      ano,
      mes,
      metaCancelamentos: 220,
      orcamentoComissaoCents: 200000, // R$ 2000,00
      baseAtivosTotal: 19554,
      inadimplenciaTotal: 43,
      diasUteis: 24,
      diasTrabalhados: 19,
      metaDiariaManual: 9,
    },
  });

  // 3) Exemplos (opcional, mas ajuda na demo)
  await prisma.solicitacaoRetencao.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        competenciaId: competencia.id,
        dataRegistro: now,
        status: StatusRetencao.CANCELADO,
        nomeCliente: "Cliente Exemplo 1",
        bairro: "Centro",
        contato: "(51) 99999-0001",
        cidade: "CACHOEIRINHA",
        regiao: Regiao.MATRIZ,
        motivo: MotivoCancelamento.INSATISFACAO_SERVICO,
        observacoes: "Sem sinal - CTO.",
        retiradaTexto: "Sem retirada",
        atendenteId: atendente.id,
      },
      {
        tenantId: TENANT_ID,
        competenciaId: competencia.id,
        dataRegistro: now,
        status: StatusRetencao.RETIDO,
        nomeCliente: "Cliente Exemplo 2",
        bairro: "Lago Azul",
        contato: "(51) 99999-0002",
        cidade: "TRAMANDAI",
        regiao: Regiao.LITORAL,
        observacoes: "Retido com 50% OFF na próxima fatura.",
        retiradaTexto: "Entregou em loja",
        atendenteId: atendente.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed concluído:", {
    ano,
    mes,
    admin: admin.email,
    atendentes: atendentes.map((a) => a.email),
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Seed falhou:", e);
  process.exit(1);
});