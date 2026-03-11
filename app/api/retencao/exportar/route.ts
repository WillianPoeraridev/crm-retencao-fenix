import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import {
  STATUS_SYSTEM_TO_CSV,
  MOTIVO_SYSTEM_TO_CSV,
  REGIAO_SYSTEM_TO_CSV,
  MESES_PT,
} from "@/lib/csv-mappings";
import { MOTIVO_LABEL } from "@/lib/labels";

const COR_HEADER_ESCURO = "FF111827";
const COR_HEADER_MEDIO  = "FF1E3A5F";
const COR_HEADER_SUAVE  = "FFF3F4F6";
const COR_CANCELADO     = "FFB91C1C";
const COR_RETIDO        = "FF15803D";
const COR_INADIMPLENCIA = "FFB45309";
const COR_BRANCO        = "FFFFFFFF";

function formatarData(d: Date): string {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")}`;
}

function formatarDataCompleta(d: Date): string {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")}/${dt.getFullYear()}`;
}

function pct(valor: number, total: number): string {
  if (total === 0) return "0,00%";
  return ((valor / total) * 100).toFixed(2).replace(".", ",") + "%";
}

function estilizarLinhaHeader(row: ExcelJS.Row, bgColor: string, fontColor = COR_BRANCO, fontSize = 10) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: fontColor }, size: fontSize };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const competenciaId = searchParams.get("competenciaId");
    if (!competenciaId) return NextResponse.json({ error: "competenciaId é obrigatório." }, { status: 400 });

    const competencia = await prisma.competencia.findUnique({ where: { id: competenciaId } });
    if (!competencia) return NextResponse.json({ error: "Competência não encontrada." }, { status: 404 });

    const solicitacoes = await prisma.solicitacaoRetencao.findMany({
      where: { competenciaId },
      include: {
        atendente: { select: { name: true } },
        cidadeInfo: { select: { nome: true } },
      },
      orderBy: [{ status: "asc" }, { dataRegistro: "asc" }],
    });

    const cancelados     = solicitacoes.filter((s) => s.status === "CANCELADO").length;
    const retidos        = solicitacoes.filter((s) => s.status === "RETIDO").length;
    const inadimplencia  = solicitacoes.filter((s) => s.status === "INADIMPLENCIA").length;
    const totalEmpresa   = cancelados + inadimplencia;
    const totalAtendidos = cancelados + retidos;
    const meta           = competencia.metaCancelamentos ?? 0;
    const saldo          = meta - cancelados;
    const baseAtivos     = competencia.baseAtivosTotal ?? 0;
    const diasUteis      = competencia.diasUteis ?? 0;
    const diasTrab       = competencia.diasTrabalhados ?? 0;
    const diasRestantes  = diasUteis - diasTrab;
    const metaDiaria     = competencia.metaDiariaManual ?? 0;
    const metaRecalculada = diasRestantes > 0 ? saldo - diasRestantes * metaDiaria : saldo;
    const churnStr       = baseAtivos > 0 ? ((totalEmpresa / baseAtivos) * 100).toFixed(2).replace(".", ",") + "%" : "—";
    const txRetencaoStr  = totalAtendidos > 0 ? pct(retidos, totalAtendidos) : "0,00%";
    const mesNome        = MESES_PT[competencia.mes - 1] ?? "";
    const nomeArquivo    = `CRM_Retencao_${mesNome}_${competencia.ano}.xlsx`;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Fênix CRM";
    wb.created = new Date();

    // ══════════════════════════════════════════════
    // ABA 1 — DADOS
    // ══════════════════════════════════════════════
    const wsDados = wb.addWorksheet("Dados");

    wsDados.columns = [
      { key: "qnt",        width: 5  },
      { key: "data",       width: 10 },
      { key: "status",     width: 14 },
      { key: "nome",       width: 30 },
      { key: "bairro",     width: 18 },
      { key: "contato",    width: 16 },
      { key: "cidade",     width: 18 },
      { key: "regiao",     width: 10 },
      { key: "agenda",     width: 16 },
      { key: "retirada",   width: 20 },
      { key: "atend",      width: 20 },
      { key: "motivo",     width: 28 },
      { key: "obs",        width: 40 },
      { key: "ixc",        width: 14 },
      { key: "transbordo", width: 16 },
    ];

    // Linha 1 — cabeçalho resumo
    const rowResumoH = wsDados.addRow([
      "META", "", "REALIZADO ORGÂNICO", "SALDO",
      "DIAS ÚTEIS", "DIAS TRABALHADOS", "DIAS RESTANTES",
      "META DIÁRIA", "META RECALCULADA", "REALIZADO INADIMPL.",
      "TOTAL EMPRESA", "CHURN GERAL", "", "",
    ]);
    rowResumoH.height = 22;
    estilizarLinhaHeader(rowResumoH, COR_HEADER_ESCURO);

    // Linha 2 — valores resumo
    const rowResumoV = wsDados.addRow([
      meta, "", cancelados, saldo,
      diasUteis, diasTrab, diasRestantes,
      metaDiaria, metaRecalculada, inadimplencia,
      totalEmpresa, churnStr, "", "",
    ]);
    rowResumoV.height = 20;
    rowResumoV.eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { bold: true, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    });

    // Linha 3 — nome do mês
    const rowMes = wsDados.addRow([mesNome]);
    rowMes.height = 20;
    rowMes.getCell(1).font = { bold: true, size: 13, color: { argb: COR_HEADER_ESCURO } };

    // Linha 4 — cabeçalho de dados
    const rowDadosH = wsDados.addRow([
      "QNT", "DATA", "STATUS", "NOME COMPLETO CLIENTE",
      "BAIRRO", "CONTATO", "CIDADE", "REGIÃO",
      "AGENDA RETIRADA", "RETIRADA", "ATENDENTE",
      "MOTIVO", "OBSERVAÇÕES", "REGISTRADO IXC", "TRANSBORDO",
    ]);
    rowDadosH.height = 22;
    estilizarLinhaHeader(rowDadosH, COR_HEADER_ESCURO);

    const COR_STATUS: Record<string, string> = {
      CANCELADO:     COR_CANCELADO,
      RETIDO:        COR_RETIDO,
      INADIMPLENCIA: COR_INADIMPLENCIA,
    };

    solicitacoes.forEach((s, i) => {
      const row = wsDados.addRow([
        1,
        formatarData(s.dataRegistro),
        STATUS_SYSTEM_TO_CSV[s.status] ?? s.status,
        s.nomeCliente,
        s.bairro ?? "",
        s.contato ?? "",
        s.cidadeInfo.nome,
        REGIAO_SYSTEM_TO_CSV[s.regiao] ?? s.regiao,
        s.agendaRetirada ? formatarDataCompleta(s.agendaRetirada) : "",
        s.retiradaTexto ?? "",
        s.atendente.name.toUpperCase(),
        s.motivo ? (MOTIVO_SYSTEM_TO_CSV[s.motivo] ?? s.motivo) : "",
        s.observacoes ?? "",
        s.registradoIXC ? "SIM" : "",
        s.transbordo ?? "",
      ]);

      row.height = 18;
      const bgZebra = i % 2 === 0 ? COR_BRANCO : "FFF9FAFB";
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgZebra } };
        cell.alignment = { vertical: "middle", wrapText: false };
        cell.font = { size: 10 };
      });
      row.getCell(3).font = {
        bold: true, size: 10,
        color: { argb: COR_STATUS[s.status] ?? COR_HEADER_ESCURO },
      };
      row.getCell(13).alignment = { vertical: "middle", wrapText: true };
    });

    wsDados.views = [{ state: "frozen", ySplit: 4 }];

    // ══════════════════════════════════════════════
    // ABA 2 — INFORMAÇÕES
    // ══════════════════════════════════════════════
    const wsInfo = wb.addWorksheet("Informações");
    wsInfo.columns = [
      { width: 32 }, { width: 16 }, { width: 16 },
      { width: 16 }, { width: 16 }, { width: 16 }, { width: 18 },
    ];

    const addSecaoHeader = (titulo: string) => {
      const r = wsInfo.addRow([titulo]);
      r.height = 22;
      estilizarLinhaHeader(r, COR_HEADER_MEDIO, COR_BRANCO, 11);
      wsInfo.addRow([]);
    };

    const addSubHeader = (colunas: string[]) => {
      const r = wsInfo.addRow(colunas);
      r.height = 18;
      estilizarLinhaHeader(r, COR_HEADER_SUAVE, COR_HEADER_ESCURO, 10);
    };

    const addLinha = (valores: (string | number)[], negrito = false) => {
      const r = wsInfo.addRow(valores);
      r.height = 17;
      r.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { size: 10, bold: negrito };
        cell.alignment = { vertical: "middle" };
      });
      return r;
    };

    // Indicadores
    addSecaoHeader("INDICADORES DA COMPETÊNCIA");
    addSubHeader(["Indicador", "Valor"]);
    addLinha(["Realizado orgânico", cancelados]);
    addLinha(["Realizado inadimplência", inadimplencia]);
    addLinha(["Total empresa", totalEmpresa], true);
    const rowSaldo = addLinha(["Saldo", saldo], true);
    rowSaldo.getCell(2).font = { bold: true, size: 10, color: { argb: saldo >= 0 ? COR_RETIDO : COR_CANCELADO } };
    if (diasRestantes > 0) {
      addLinha(["Dias restantes", diasRestantes]);
      addLinha(["Meta recalculada", metaRecalculada]);
    }
    addLinha(["Churn geral fulltime", churnStr]);
    addLinha(["Taxa de retenção", txRetencaoStr]);
    wsInfo.addRow([]);

    // Motivos
    const motivosCount: Record<string, number> = {};
    for (const s of solicitacoes) {
      if (s.status === "CANCELADO" && s.motivo && s.motivo !== "INADIMPLENCIA_90") {
        motivosCount[s.motivo] = (motivosCount[s.motivo] ?? 0) + 1;
      }
    }

    addSecaoHeader(`MOTIVOS DE CANCELAMENTO (${cancelados} cancelados)`);
    addSubHeader(["Motivo", "Quantidade", "Percentual"]);
    Object.entries(motivosCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([motivo, count]) => {
        addLinha([MOTIVO_LABEL[motivo] ?? motivo, count, pct(count, cancelados)]);
      });
    wsInfo.addRow([]);

    // Ranking
    const atendentesMap: Record<string, { nome: string; total: number; cancelados: number; retidos: number }> = {};
    for (const s of solicitacoes) {
      if (s.status === "INADIMPLENCIA") continue;
      if (!atendentesMap[s.atendenteId]) {
        atendentesMap[s.atendenteId] = { nome: s.atendente.name, total: 0, cancelados: 0, retidos: 0 };
      }
      atendentesMap[s.atendenteId].total++;
      if (s.status === "CANCELADO") atendentesMap[s.atendenteId].cancelados++;
      if (s.status === "RETIDO")    atendentesMap[s.atendenteId].retidos++;
    }

    addSecaoHeader("RANKING POR ATENDENTE");
    addSubHeader(["Atendente", "Total", "Cancelados", "Retidos", "Tx. Retenção", "Tx. Part.", "Proj. Comissão"]);

    Object.values(atendentesMap)
      .sort((a, b) => b.retidos - a.retidos)
      .forEach((a) => {
        const projComissao = competencia.orcamentoComissaoCents && retidos > 0
          ? "R$ " + ((competencia.orcamentoComissaoCents * a.retidos / retidos) / 100).toFixed(2).replace(".", ",")
          : "—";
        const row = addLinha([a.nome, a.total, a.cancelados, a.retidos, pct(a.retidos, a.total), pct(a.retidos, retidos), projComissao]);
        row.getCell(3).font = { size: 10, color: { argb: COR_CANCELADO } };
        row.getCell(4).font = { size: 10, color: { argb: COR_RETIDO } };
        row.getCell(7).font = { size: 10, bold: true, color: { argb: COR_RETIDO } };
      });

    if (competencia.orcamentoComissaoCents) {
      wsInfo.addRow([]);
      const orcamento = "R$ " + (competencia.orcamentoComissaoCents / 100).toFixed(2).replace(".", ",");
      const rowOrc = addLinha(["Orçamento total", "", "", "", "", "", orcamento], true);
      rowOrc.getCell(7).font = { bold: true, size: 11, color: { argb: COR_HEADER_ESCURO } };
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("[retencao/exportar GET]", error);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}