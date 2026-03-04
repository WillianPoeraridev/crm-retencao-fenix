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
  try {
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
      // AGENDA RETIRADA: data formatada se existir, senão vazio
      const agenda = s.agendaRetirada
        ? formatarDataCompleta(s.agendaRetirada)
        : "";
      // RETIRADA: texto livre sempre exportado na coluna correta
      const retirada = s.retiradaTexto ?? "";

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

    // ─── SEÇÃO: INFORMAÇÕES ───────────────────────────────────────────
    linhas.push("");
    linhas.push("INFORMAÇÕES DA COMPETÊNCIA;;;;;;;;;;;;;;;;;;");
    linhas.push("");

    // Indicadores
    const totalAtendidos = cancelados + retidos;
    const txRetencao = totalAtendidos > 0
      ? ((retidos / totalAtendidos) * 100).toFixed(2) + "%"
      : "0,00%";
    const metaRecalcStr = diasRestantes > 0
      ? String(Math.ceil(saldo / diasRestantes))
      : "—";
    const churnStr = baseAtivos > 0
      ? ((totalEmpresa / baseAtivos) * 100).toFixed(2).replace(".", ",") + "%"
      : "—";

    linhas.push("INDICADORES;;;;;;;;;;;;;;;;;;");
    linhas.push(`Realizado orgânico;${cancelados};;;;;;;;;;;;;;;;;`);
    linhas.push(`Realizado inadimplência;${inadimplencia};;;;;;;;;;;;;;;;;`);
    linhas.push(`Total empresa;${totalEmpresa};;;;;;;;;;;;;;;;;`);
    linhas.push(`Saldo;${saldo};;;;;;;;;;;;;;;;;`);
    if (diasRestantes > 0) {
      linhas.push(`Dias restantes;${diasRestantes};;;;;;;;;;;;;;;;;`);
      linhas.push(`Meta recalculada;${metaRecalcStr};;;;;;;;;;;;;;;;;`);
    }
    linhas.push(`Churn geral fulltime;${churnStr};;;;;;;;;;;;;;;;;`);
    linhas.push(`Taxa de retenção;${txRetencao};;;;;;;;;;;;;;;;;`);

    // Motivos de cancelamento
    linhas.push("");
    linhas.push(`MOTIVOS DE CANCELAMENTO (${cancelados} cancelados);;;;;;;;;;;;;;;;;;`);
    linhas.push("Motivo;Quantidade;Percentual;;;;;;;;;;;;;;;;;");

    const MOTIVO_LABEL: Record<string, string> = {
      INSATISFACAO_ATD: "Insatisfação c/ Atendimento",
      INSATISFACAO_SERVICO: "Insatisfação c/ Serviço",
      MUDANCA_ENDERECO: "Mudança de Endereço",
      MOTIVOS_PESSOAIS: "Motivos Pessoais",
      TROCA_PROVEDOR: "Troca de Provedor",
      PROBLEMAS_FINANC: "Problemas Financeiros",
      OUTROS: "Outros",
    };

    const motivosCount: Record<string, number> = {};
    for (const s of solicitacoes) {
      if (s.status === "CANCELADO" && s.motivo && s.motivo !== "INADIMPLENCIA_90") {
        motivosCount[s.motivo] = (motivosCount[s.motivo] ?? 0) + 1;
      }
    }
    const motivosOrdenados = Object.entries(motivosCount).sort((a, b) => b[1] - a[1]);
    for (const [motivo, count] of motivosOrdenados) {
      const pct = cancelados > 0
        ? ((count / cancelados) * 100).toFixed(2).replace(".", ",") + "%"
        : "0,00%";
      const label = MOTIVO_LABEL[motivo] ?? motivo;
      linhas.push(`${label};${count};${pct};;;;;;;;;;;;;;;;;`);
    }

    // Ranking por atendente
    linhas.push("");
    linhas.push("RANKING POR ATENDENTE;;;;;;;;;;;;;;;;;;");
    linhas.push("Atendente;Total;Cancelados;Retidos;Tx. Retenção;Tx. Participação;Proj. Comissão;;;;;;;;;;;;;");

    const atendentesMap: Record<string, { nome: string; total: number; cancelados: number; retidos: number }> = {};
    for (const s of solicitacoes) {
      if (s.status === "INADIMPLENCIA") continue;
      const id = s.atendenteId;
      if (!atendentesMap[id]) {
        atendentesMap[id] = { nome: s.atendente.name, total: 0, cancelados: 0, retidos: 0 };
      }
      atendentesMap[id].total++;
      if (s.status === "CANCELADO") atendentesMap[id].cancelados++;
      if (s.status === "RETIDO") atendentesMap[id].retidos++;
    }

    const ranking = Object.values(atendentesMap).sort((a, b) => b.retidos - a.retidos);
    for (const a of ranking) {
      const txRet = a.total > 0
        ? ((a.retidos / a.total) * 100).toFixed(2).replace(".", ",") + "%"
        : "0,00%";
      const txPart = retidos > 0
        ? ((a.retidos / retidos) * 100).toFixed(2).replace(".", ",") + "%"
        : "0,00%";
      const projComissao = competencia.orcamentoComissaoCents && retidos > 0
        ? ((competencia.orcamentoComissaoCents * a.retidos / retidos) / 100)
            .toFixed(2).replace(".", ",")
        : "";
      linhas.push(`${a.nome};${a.total};${a.cancelados};${a.retidos};${txRet};${txPart};${projComissao ? "R$ " + projComissao : "—"};;;;;;;;;;;;;`);
    }

    if (competencia.orcamentoComissaoCents) {
      const orcamento = (competencia.orcamentoComissaoCents / 100).toFixed(2).replace(".", ",");
      linhas.push(`Orçamento total;;;;;;R$ ${orcamento};;;;;;;;;;;;;`);
    }
    // ──────────────────────────────────────────────────────────────────

    const csv = "\uFEFF" + linhas.join("\r\n") + "\r\n";

    const nomeArquivo = `CRM_Retencao_${mesNome}_${competencia.ano}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("[retencao/exportar GET]", error);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}