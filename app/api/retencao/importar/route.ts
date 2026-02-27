import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Regiao, StatusRetencao, MotivoCancelamento } from "@prisma/client";

interface LinhaImportacao {
  dataRegistro: string;
  status: string;
  nomeCliente: string;
  bairro: string;
  contato: string;
  cidade: string;
  regiao: string;
  agendaRetirada: string | null;
  retiradaTexto: string | null;
  atendenteNome: string;
  motivo: string | null;
  observacoes: string | null;
}

// POST — importa linhas validadas pelo frontend
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas ADMIN pode importar." }, { status: 401 });
  }

  const body = await req.json();
  const { competenciaId, linhas } = body as {
    competenciaId: string;
    linhas: LinhaImportacao[];
  };

  if (!competenciaId || !linhas || !Array.isArray(linhas) || linhas.length === 0) {
    return NextResponse.json({ error: "competenciaId e linhas são obrigatórios." }, { status: 400 });
  }

  // Valida competência
  const competencia = await prisma.competencia.findUnique({ where: { id: competenciaId } });
  if (!competencia) {
    return NextResponse.json({ error: "Competência não encontrada." }, { status: 404 });
  }

  // Busca atendentes ativos
  const usuarios = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  // Mapa de nome (uppercase) → id
  const atendenteMap = new Map<string, string>();
  for (const u of usuarios) {
    atendenteMap.set(u.name.toUpperCase().trim(), u.id);
    // Também mapeia primeiro nome
    const primeiro = u.name.split(" ")[0].toUpperCase().trim();
    if (!atendenteMap.has(primeiro)) {
      atendenteMap.set(primeiro, u.id);
    }
  }

  // Busca cidades ativas
  const cidades = await prisma.cidade.findMany({ select: { id: true } });
  const cidadeIds = new Set(cidades.map((c) => c.id));

  const erros: string[] = [];
  const dadosValidos: Array<{
    competenciaId: string;
    atendenteId: string;
    dataRegistro: Date;
    status: StatusRetencao;
    nomeCliente: string;
    bairro: string | null;
    contato: string | null;
    cidade: string;
    regiao: Regiao;
    motivo: MotivoCancelamento | null;
    observacoes: string | null;
    retiradaTexto: string | null;
    agendaRetirada: Date | null;
  }> = [];

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const num = i + 1;

    // Atendente
    const nomeAtt = l.atendenteNome?.toUpperCase().trim() ?? "";
    const atendenteId = atendenteMap.get(nomeAtt);

    // Se atendente é "COBRANÇA" ou não encontrado, usa o admin que importou
    const attId = atendenteId ?? session.user.id;
    if (!atendenteId && nomeAtt && nomeAtt !== "COBRANÇA") {
      erros.push(`Linha ${num}: atendente "${l.atendenteNome}" não encontrado, atribuído a você.`);
    }

    // Validações
    if (!l.nomeCliente?.trim()) {
      erros.push(`Linha ${num}: nome do cliente vazio, pulando.`);
      continue;
    }
    if (!Object.values(StatusRetencao).includes(l.status as StatusRetencao)) {
      erros.push(`Linha ${num}: status inválido "${l.status}", pulando.`);
      continue;
    }
    if (!Object.values(Regiao).includes(l.regiao as Regiao)) {
      erros.push(`Linha ${num}: região inválida "${l.regiao}", pulando.`);
      continue;
    }
    if (!cidadeIds.has(l.cidade)) {
      erros.push(`Linha ${num}: cidade "${l.cidade}" não cadastrada, pulando.`);
      continue;
    }

    let motivo: MotivoCancelamento | null = null;
    if (l.motivo) {
      if (Object.values(MotivoCancelamento).includes(l.motivo as MotivoCancelamento)) {
        motivo = l.motivo as MotivoCancelamento;
      } else {
        erros.push(`Linha ${num}: motivo "${l.motivo}" inválido, ignorado.`);
      }
    }

    // Data
    let dataRegistro: Date;
    try {
      dataRegistro = new Date(l.dataRegistro);
      if (isNaN(dataRegistro.getTime())) throw new Error();
    } catch {
      erros.push(`Linha ${num}: data inválida "${l.dataRegistro}", usando hoje.`);
      dataRegistro = new Date();
    }

    // Agenda retirada
    let agendaRetirada: Date | null = null;
    if (l.agendaRetirada) {
      try {
        const d = new Date(l.agendaRetirada);
        if (!isNaN(d.getTime())) agendaRetirada = d;
      } catch {
        // ignora
      }
    }

    dadosValidos.push({
      competenciaId: competencia.id,
      atendenteId: attId,
      dataRegistro,
      status: l.status as StatusRetencao,
      nomeCliente: l.nomeCliente.trim(),
      bairro: l.bairro?.trim() || null,
      contato: l.contato?.trim() || null,
      cidade: l.cidade,
      regiao: l.regiao as Regiao,
      motivo,
      observacoes: l.observacoes?.trim() || null,
      retiradaTexto: l.retiradaTexto?.trim() || null,
      agendaRetirada,
    });
  }

  if (dadosValidos.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma linha válida para importar.", erros },
      { status: 400 }
    );
  }

  // Cria tudo de uma vez
  const resultado = await prisma.solicitacaoRetencao.createMany({
    data: dadosValidos,
    skipDuplicates: false,
  });

  return NextResponse.json({
    importados: resultado.count,
    total: linhas.length,
    erros,
  });
}