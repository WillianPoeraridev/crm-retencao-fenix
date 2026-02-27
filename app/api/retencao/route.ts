import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Regiao, StatusRetencao, MotivoCancelamento } from "@prisma/client";

export async function POST(req: NextRequest) {
  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Parsing do body
  const body = await req.json();

  const {
    competenciaId,
    nomeCliente,
    contato,
    bairro,
    cidade,
    regiao,
    status,
    motivo,
    observacoes,
    retiradaTexto,
    agendaRetirada,
  } = body;

  // 3. Validação da competência
  if (!competenciaId) {
    return NextResponse.json(
      { error: "competenciaId é obrigatório." },
      { status: 400 }
    );
  }

  const competencia = await prisma.competencia.findUnique({
    where: { id: competenciaId },
  });

  if (!competencia) {
    return NextResponse.json(
      { error: "Competência não encontrada." },
      { status: 404 }
    );
  }

  // 4. Campos obrigatórios
  if (!nomeCliente || !cidade || !regiao || !status) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando: nomeCliente, cidade, regiao, status." },
      { status: 400 }
    );
  }

  // 5. Validação de cidade — agora consulta a tabela
  const cidadeExiste = await prisma.cidade.findUnique({ where: { id: cidade } });
  if (!cidadeExiste || !cidadeExiste.isActive) {
    return NextResponse.json({ error: `Cidade inválida ou inativa: ${cidade}` }, { status: 400 });
  }

  // 6. Validação dos enums restantes
  if (!Object.values(Regiao).includes(regiao)) {
    return NextResponse.json({ error: `Região inválida: ${regiao}` }, { status: 400 });
  }
  if (!Object.values(StatusRetencao).includes(status)) {
    return NextResponse.json({ error: `Status inválido: ${status}` }, { status: 400 });
  }
  if (motivo && !Object.values(MotivoCancelamento).includes(motivo)) {
    return NextResponse.json({ error: `Motivo inválido: ${motivo}` }, { status: 400 });
  }

  // 7. Cancelado sem motivo — não pode
  if (status === "CANCELADO" && !motivo) {
    return NextResponse.json(
      { error: "Motivo é obrigatório quando o status é CANCELADO." },
      { status: 400 }
    );
  }

  // 8. Criação no banco
  const solicitacao = await prisma.solicitacaoRetencao.create({
    data: {
      competenciaId: competencia.id,
      atendenteId: session.user.id,
      dataRegistro: new Date(),
      nomeCliente: nomeCliente.trim(),
      contato: contato?.trim() || null,
      bairro: bairro?.trim() || null,
      cidade,
      regiao,
      status,
      motivo: motivo || null,
      observacoes: observacoes?.trim() || null,
      retiradaTexto: retiradaTexto?.trim() || null,
      agendaRetirada: agendaRetirada ? new Date(agendaRetirada) : null,
    },
  });

  return NextResponse.json(solicitacao, { status: 201 });
}