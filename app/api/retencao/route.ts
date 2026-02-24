import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompetenciaAtual } from "@/lib/retencao";
import { Cidade, Regiao, StatusRetencao, MotivoCancelamento } from "@prisma/client";

export async function POST(req: NextRequest) {
  // 1. Autenticação — só usuários logados podem criar
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Competência atual — precisa existir para associar a solicitação
  const competencia = await getCompetenciaAtual();
  if (!competencia) {
    return NextResponse.json(
      { error: "Nenhuma competência ativa para este mês." },
      { status: 422 }
    );
  }

  // 3. Parsing do body
  const body = await req.json();

  const {
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

  // 4. Validação dos campos obrigatórios
  if (!nomeCliente || !cidade || !regiao || !status) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando: nomeCliente, cidade, regiao, status." },
      { status: 400 }
    );
  }

  // 5. Validação dos enums
  if (!Object.values(Cidade).includes(cidade)) {
    return NextResponse.json({ error: `Cidade inválida: ${cidade}` }, { status: 400 });
  }
  if (!Object.values(Regiao).includes(regiao)) {
    return NextResponse.json({ error: `Região inválida: ${regiao}` }, { status: 400 });
  }
  if (!Object.values(StatusRetencao).includes(status)) {
    return NextResponse.json({ error: `Status inválido: ${status}` }, { status: 400 });
  }
  if (motivo && !Object.values(MotivoCancelamento).includes(motivo)) {
    return NextResponse.json({ error: `Motivo inválido: ${motivo}` }, { status: 400 });
  }

  // 6. Criação no banco
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
