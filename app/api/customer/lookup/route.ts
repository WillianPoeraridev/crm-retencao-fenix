import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withTenant } from "@/lib/prisma";
import { z } from "zod";
import { cpfCnpjSchema } from "@/lib/validators/cpf-cnpj";
import { apiError } from "@/lib/api-utils";

const bodySchema = z.object({
  cpfCnpj: cpfCnpjSchema,
  // Hints usados apenas na criação automática quando o customer não existe.
  // Em lookups subsequentes do mesmo CPF, esses valores são ignorados.
  nome: z.string().min(1, "Nome obrigatório quando o cliente é novo").optional(),
  contatoPrimario: z.string().nullish(),
});

/**
 * POST /api/customer/lookup
 *
 * Get-or-create de Customer (fonte da verdade compartilhada entre os CRMs da plataforma).
 * Retorna o customer pelo CPF/CNPJ normalizado, criando se não existir.
 *
 * Inclui contagens cross-CRM (solicitações no Retenção via Prisma, vendas + leads
 * no Comercial via raw query) pra UI mostrar contexto tipo "este cliente já fechou
 * 2 vendas no comercial".
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const db = withTenant(tenantId);

    const body = await req.json();
    const { cpfCnpj, nome, contatoPrimario } = bodySchema.parse(body);

    // 1. Tenta achar customer existente, já com counts locais (Retenção)
    //    findFirst (não findUnique) p/ o withTenant injetar tenantId no where.
    let customer = await db.customer.findFirst({
      where: { cpfCnpj },
      include: {
        _count: { select: { solicitacoes: true } },
      },
    });

    let created = false;

    // 2. Não existe → comportamento depende de ter recebido `nome`
    if (!customer) {
      if (!nome) {
        // Modo "lookup-only": frontend só quer saber se existe (ex: onBlur do campo)
        return NextResponse.json({ found: false });
      }
      // Modo "get-or-create": cria (tenantId injetado pelo withTenant)
      created = true;
      const novo = await db.customer.create({
        data: {
          tenantId,
          cpfCnpj,
          nome,
          contatoPrimario: contatoPrimario ?? null,
        },
      });
      customer = { ...novo, _count: { solicitacoes: 0 } };
    }

    // 3. Conta vendas + leads via raw query (cross-schema).
    //    SQL cru NÃO passa pelo withTenant → filtro de tenantId explícito.
    const comercialCountsResult = await prisma.$queryRaw<
      { vendas: number; leads: number }[]
    >`
      SELECT
        (SELECT COUNT(*)::int FROM "comercial"."Venda" WHERE "customerId" = ${customer.id} AND "tenantId" = ${tenantId}) AS vendas,
        (SELECT COUNT(*)::int FROM "comercial"."LeadCarteira" WHERE "customerId" = ${customer.id} AND "tenantId" = ${tenantId}) AS leads
    `;
    const { vendas = 0, leads = 0 } = comercialCountsResult[0] ?? {};

    return NextResponse.json({
      found: true,
      id: customer.id,
      cpfCnpj: customer.cpfCnpj,
      nome: customer.nome,
      contatoPrimario: customer.contatoPrimario,
      created,
      counts: {
        vendas,
        leads,
        solicitacoes: customer._count.solicitacoes,
      },
    });
  } catch (e) {
    return apiError(e, "POST /api/customer/lookup");
  }
}
