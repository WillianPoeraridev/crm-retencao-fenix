import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  STATUS_SYSTEM_TO_CSV,
  MOTIVO_SYSTEM_TO_CSV,
  REGIAO_SYSTEM_TO_CSV,
  MESES_PT,
} from "@/lib/csv-mappings";

function formatarData(d: Date): string {
  const dt = new Date(d);
  const dia = dt.getDate().toString().padStart(2, "0");
  const mes = (dt.getMonth() + 1).toString().padStart(2, "0");
  return `${dia}/${mes}`;
}

function formatarDataCompleta(d: Date): string {
  const dt = new Date(d);
  const dia = dt.getDate().toString().padStart(2, "0");
  const mes = (dt.getMonth() + 1).toString().padStart(2, "0");
  const ano = dt.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function escaparCSV(texto: string | null): string {
  if (!texto) return "";
  // Se contém ; ou " ou quebra de linha, envolve em aspas
  if (texto.includes(";") || texto.includes('"') || texto.includes("\n")) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

// GET — exporta solicitações da competência no formato da planilha do gerente
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const competenciaId = searchParams.get("competenciaId");

  if (!competenciaId) {
    return NextResponse.json({ error: "competenciaId é obrigatório." }, { status: 400 });
  }

  const competencia = await prisma.competencia.findUnique({
    where: { id: competenciaId },
  });

  if (!competencia) {
    return NextResponse.json({ error: "Competência não encontrada." }, { status: 404 });
  }

  const solicitacoes = await prisma.solicitacaoRetencao.findMany({
    where: { competenciaId },
    include: {
      atendente: { select: { name: true } },
      cidadeInfo: { select: { nome: true } },
    },
    orderBy: [{ status: "asc" }, { dataRegistro: "asc" }],
  });

  // Contadores
  const cancelados = solicitacoes.filter((s) => s.status === "CANCELADO").length;
  const retidos = solicitacoes.filter((s) => s.status === "RETIDO").length;
  const inadimplencia = solicitacoes.filter((s) => s.status === "INADIMPLENCIA").length;
  const totalEmpresa = cancelados + inadimplencia;
  const meta = competencia.metaCancelamentos ?? 0;
  const saldo = meta - cancelados;
  const baseAtivos = competencia.baseAtivosTotal ?? 0;
  const churn = baseAtivos > 0 ? ((totalEmpresa / baseAtivos) * 100).toFixed(2) + "%" : "";

  const mesNome = MESES_PT[competencia.mes - 1] ?? "";

  // Monta as linhas
  const linhas: string[] = [];

  // Linha 1 — cabeçalho resumo
  linhas.push(
    `META;;REALIZADO FULL TIME organico;SALDO;DIAS úteis;DIAS trabalhados;DIAS RESTANTES;META diaria;META recalculada;REALIZADO FULL TIME inadimplencia;TOTAL EMPRESA;CHURN GERAL fulltime;;;;;;`
  );

  // Linha 2 — valores resumo
  const diasUteis = competencia.diasUteis ?? 0;
  const diasTrab = competencia.diasTrabalhados ?? 0;
  const diasRestantes = diasUteis - diasTrab;
  const metaDiaria = competencia.metaDiariaManual ?? 0;
  const metaRecalculada = diasRestantes > 0 ? saldo - (diasRestantes * metaDiaria) : saldo;

  linhas.push(
    `${meta};;${cancelados};${saldo};${diasUteis};${diasTrab};${diasRestantes};${metaDiaria};${metaRecalculada};${inadimplencia};${totalEmpresa};${churn};;;;;;`
  );

  // Linha 3 — nome do mês
  linhas.push(`${mesNome};;;;;;;;;;;;;;;;;;`);

  // Linha 4 — cabeçalho dados
  linhas.push(
    `QNT;DATA;STATUS;NOME COMPLETO CLIENTE;BAIRRO;CONTATO;CIDADE;REGIÃO;AGENDA RETIRADA;RETIRADA;ATENDENTE;MOTIVO;OBSERVAÇÕES;REGISTRADO IXC;;;;;`
  );

  // Linhas de dados — agrupa por status na ordem: CANCELADO, RETIDO, INADIMPLENCIA
  for (const s of solicitacoes) {
    const data = formatarData(s.dataRegistro);
    const status = STATUS_SYSTEM_TO_CSV[s.status] ?? s.status;
    const motivo = s.motivo ? (MOTIVO_SYSTEM_TO_CSV[s.motivo] ?? s.motivo) : "";
    const regiao = REGIAO_SYSTEM_TO_CSV[s.regiao] ?? s.regiao;
    const cidade = s.cidadeInfo.nome;
    const agenda = s.agendaRetirada
      ? formatarDataCompleta(s.agendaRetirada)
      : s.retiradaTexto?.includes("Sem") ? "Sem retirada" : "";
    const retirada = s.retiradaTexto && !s.retiradaTexto.includes("Sem") ? s.retiradaTexto : "";

    linhas.push(
      [
        "1",
        data,
        status,
        escaparCSV(s.nomeCliente),
        escaparCSV(s.bairro),
        escaparCSV(s.contato),
        escaparCSV(cidade),
        regiao,
        agenda,
        escaparCSV(retirada),
        s.atendente.name.toUpperCase(),
        motivo,
        escaparCSV(s.observacoes),
        "", // REGISTRADO IXC
        "", "", "", "", "",
      ].join(";")
    );
  }

  const csv = "\uFEFF" + linhas.join("\r\n") + "\r\n";

  const nomeArquivo = `CRM_Retencao_${competencia.ano}_${mesNome}_${competencia.ano}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}