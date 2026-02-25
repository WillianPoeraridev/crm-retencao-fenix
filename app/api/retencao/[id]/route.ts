import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Cidade, Regiao, StatusRetencao, MotivoCancelamento } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const existente = await prisma.solicitacaoRetencao.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Solicitacao nao encontrada." }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && existente.atendenteId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissao para editar esta solicitacao." }, { status: 403 });
  }

  const body = await req.json();
  const { nomeCliente, contato, bairro, cidade, regiao, status, motivo, observacoes, retiradaTexto, agendaRetirada } = body;

  if (!nomeCliente || !cidade || !regiao || !status) {
    return NextResponse.json({ error: "Campos obrigatorios faltando." }, { status: 400 });
  }
  if (!Object.values(Cidade).includes(cidade)) {
    return NextResponse.json({ error: "Cidade invalida: " + cidade }, { status: 400 });
  }
  if (!Object.values(Regiao).includes(regiao)) {
    return NextResponse.json({ error: "Regiao invalida: " + regiao }, { status: 400 });
  }
  if (!Object.values(StatusRetencao).includes(status)) {
    return NextResponse.json({ error: "Status invalido: " + status }, { status: 400 });
  }
  if (motivo && !Object.values(MotivoCancelamento).includes(motivo)) {
    return NextResponse.json({ error: "Motivo invalido: " + motivo }, { status: 400 });
  }

  const atualizado = await prisma.solicitacaoRetencao.update({
    where: { id },
    data: {
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

  return NextResponse.json(atualizado);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const existente = await prisma.solicitacaoRetencao.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Solicitacao nao encontrada." }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && existente.atendenteId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissao para excluir esta solicitacao." }, { status: 403 });
  }

  await prisma.solicitacaoRetencao.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}