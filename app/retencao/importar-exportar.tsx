"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/app/toast";
import {
  normalizarCidade,
  normalizarRegiao,
  normalizarMotivo,
  normalizarStatus,
  parsearDataCSV,
  ehTextoRetirada,
} from "@/lib/csv-mappings";

interface LinhaPreview {
  idx: number;
  dataRegistro: string;
  status: string;
  nomeCliente: string;
  bairro: string;
  contato: string;
  cidade: string;
  cidadeOriginal: string;
  regiao: string;
  regiaoOriginal: string;
  agendaRetirada: string | null;
  retiradaTexto: string | null;
  atendenteNome: string;
  motivo: string | null;
  motivoOriginal: string;
  observacoes: string | null;
  registradoIXC: boolean;
  transbordo: string | null;
  ticketCents: number | null;
  erro: string | null;
}

function parseTicket(raw: string): number | null {
  if (!raw) return null;
  const limpo = raw.replace(/[R$\s]/gi, "").replace(",", ".");
  if (!limpo) return null;
  const n = parseFloat(limpo);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

// Mapeia o nome de cabeçalho para um campo lógico. Lida com variações
// de acento, caixa e espaços. A planilha da Fênix mudou e agora pode
// ter "TICKET CLIENTE" entre RETIRADA e ATENDENTE.
function normalizarHeader(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const HEADER_TO_FIELD: Record<string, string> = {
  "DATA": "data",
  "STATUS": "status",
  "NOME COMPLETO CLIENTE": "nomeCliente",
  "NOME CLIENTE": "nomeCliente",
  "BAIRRO": "bairro",
  "CONTATO": "contato",
  "CIDADE": "cidade",
  "REGIAO": "regiao",
  "AGENDA RETIRADA": "agendaRetirada",
  "RETIRADA": "retirada",
  "TICKET CLIENTE": "ticket",
  "TICKET": "ticket",
  "ATENDENTE": "atendente",
  "MOTIVO": "motivo",
  "OBSERVACOES": "observacoes",
  "OBSERVACAO": "observacoes",
  "REGISTRADO IXC": "registradoIXC",
  "IXC": "registradoIXC",
  "TRANSBORDO": "transbordo",
};

interface Props {
  competenciaId: string | null;
  ano: number;
  isAdmin: boolean;
}

function parsearCSV(texto: string, anoBase: number): LinhaPreview[] {
  const linhas = texto.split(/\r?\n/);
  const resultado: LinhaPreview[] = [];

  // Localiza a linha de cabeçalho (começa com "QNT;" ou contém "STATUS").
  // Dados começam logo após.
  let headerLine = -1;
  for (let i = 0; i < Math.min(linhas.length, 10); i++) {
    if (linhas[i].toUpperCase().startsWith("QNT;")) {
      headerLine = i;
      break;
    }
  }
  if (headerLine === -1) headerLine = 3; // fallback

  const headerCells = parsearLinhaSemicolon(linhas[headerLine] ?? "");
  // Mapa de campo lógico → índice da coluna no CSV
  const idx: Record<string, number> = {};
  for (let i = 0; i < headerCells.length; i++) {
    const campo = HEADER_TO_FIELD[normalizarHeader(headerCells[i])];
    if (campo && idx[campo] === undefined) idx[campo] = i;
  }

  const inicioData = headerLine + 1;
  const get = (campos: string[], campo: string): string => {
    const i = idx[campo];
    return i !== undefined ? (campos[i] ?? "").trim() : "";
  };

  for (let i = inicioData; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha.trim()) continue;

    const campos = parsearLinhaSemicolon(linha);

    const statusRaw = get(campos, "status");
    const status = normalizarStatus(statusRaw);

    // Pula linhas que não são dados (resumos, títulos, etc.)
    if (!status) continue;

    const nomeCliente = get(campos, "nomeCliente");
    if (!nomeCliente) continue;

    const cidadeRaw = get(campos, "cidade");
    const cidade = normalizarCidade(cidadeRaw);

    const regiaoRaw = get(campos, "regiao");
    const regiao = normalizarRegiao(regiaoRaw);

    const motivoRaw = get(campos, "motivo");
    const motivo = motivoRaw ? normalizarMotivo(motivoRaw) : null;

    const dataRaw = get(campos, "data");
    const dataParsed = parsearDataCSV(dataRaw, anoBase);

    const agendaRaw = get(campos, "agendaRetirada");
    let agendaRetirada: string | null = null;
    let retiradaTexto: string | null = null;

    if (agendaRaw) {
      const agendaDate = parsearDataCSV(agendaRaw, anoBase);
      if (agendaDate) {
        agendaRetirada = agendaDate.toISOString();
      } else if (ehTextoRetirada(agendaRaw)) {
        retiradaTexto = agendaRaw;
      } else {
        retiradaTexto = agendaRaw;
      }
    }

    const retiradaCol = get(campos, "retirada");
    if (retiradaCol && !retiradaTexto) {
      retiradaTexto = retiradaCol;
    }

    const ticketRaw = get(campos, "ticket");
    const ticketCents = parseTicket(ticketRaw);

    // Monta erros
    let erro: string | null = null;
    if (!cidade) erro = `Cidade "${cidadeRaw}" não reconhecida`;
    else if (!regiao) erro = `Região "${regiaoRaw}" não reconhecida`;
    else if (status === "CANCELADO" && !motivo && motivoRaw)
      erro = `Motivo "${motivoRaw}" não reconhecido`;

    resultado.push({
      idx: i,
      dataRegistro: dataParsed?.toISOString() ?? new Date().toISOString(),
      status,
      nomeCliente,
      bairro: get(campos, "bairro"),
      contato: get(campos, "contato"),
      cidade: cidade ?? "",
      cidadeOriginal: cidadeRaw,
      regiao: regiao ?? "",
      regiaoOriginal: regiaoRaw,
      agendaRetirada,
      retiradaTexto,
      atendenteNome: get(campos, "atendente"),
      motivo,
      motivoOriginal: motivoRaw,
      observacoes: get(campos, "observacoes") || null,
      registradoIXC: get(campos, "registradoIXC").toUpperCase() === "SIM",
      transbordo: get(campos, "transbordo") || null,
      ticketCents,
      erro,
    });
  }

  return resultado;
}

function parsearLinhaSemicolon(linha: string): string[] {
  const resultado: string[] = [];
  let campo = "";
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];

    if (dentroAspas) {
      if (c === '"') {
        if (i + 1 < linha.length && linha[i + 1] === '"') {
          campo += '"';
          i++; // pula o segundo "
        } else {
          dentroAspas = false;
        }
      } else {
        campo += c;
      }
    } else {
      if (c === '"') {
        dentroAspas = true;
      } else if (c === ";") {
        resultado.push(campo);
        campo = "";
      } else if (c === "\r") {
        // ignora
      } else {
        campo += c;
      }
    }
  }

  resultado.push(campo);
  return resultado;
}

const STATUS_COR: Record<string, string> = {
  CANCELADO: "#b91c1c",
  RETIDO: "#15803d",
  INADIMPLENCIA: "#b45309",
};

export function ImportarExportar({ competenciaId, ano, isAdmin }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<LinhaPreview[] | null>(null);
  const [importando, setImportando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "sucesso" | "erro" } | null>(null);

  function handleExportar() {
    if (!competenciaId) return;
    window.open(`/api/retencao/exportar?competenciaId=${competenciaId}`, "_blank");
  }

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Padrões que indicam leitura errada de Windows-1252 como UTF-8.
    // Ex: "ã" (C3 A3) lido como "Ã£", "é" (C3 A9) como "Ã©", etc.
    function pareceMalLido(texto: string): boolean {
      return (
        texto.includes("\uFFFD") ||   // caractere de substituição explícito
        /Ã[£¢¡§©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/.test(texto) // sequências típicas de double-encoding
      );
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const textoUTF8 = ev.target?.result as string;

      if (pareceMalLido(textoUTF8)) {
        // Re-lê como Windows-1252 (encoding padrão do Excel no Windows/OneDrive)
        const reader2 = new FileReader();
        reader2.onload = (ev2) => {
          const texto1252 = ev2.target?.result as string;
          setPreview(parsearCSV(texto1252, ano));
        };
        reader2.readAsText(file, "windows-1252");
      } else {
        setPreview(parsearCSV(textoUTF8, ano));
      }
    };
    reader.readAsText(file, "utf-8");

    // Reset para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  }

  async function confirmarImportacao() {
    if (!preview || !competenciaId) return;

    const validas = preview.filter((l) => !l.erro);
    if (validas.length === 0) {
      setToast({ msg: "Nenhuma linha válida para importar.", tipo: "erro" });
      return;
    }

    setImportando(true);
    try {
      const res = await fetch("/api/retencao/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competenciaId,
          linhas: validas.map((l) => ({
            dataRegistro: l.dataRegistro,
            status: l.status,
            nomeCliente: l.nomeCliente,
            bairro: l.bairro,
            contato: l.contato,
            cidade: l.cidade,
            regiao: l.regiao,
            agendaRetirada: l.agendaRetirada,
            retiradaTexto: l.retiradaTexto,
            atendenteNome: l.atendenteNome,
            motivo: l.motivo,
            observacoes: l.observacoes,
            registradoIXC: l.registradoIXC,
            transbordo: l.transbordo,
            ticketCents: l.ticketCents,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ msg: data.error ?? "Erro na importação.", tipo: "erro" });
        return;
      }

      setPreview(null);
      router.refresh();
      setToast({
        msg: `${data.importados} solicitações importadas com sucesso!${data.erros?.length ? ` (${data.erros.length} avisos)` : ""}`,
        tipo: "sucesso",
      });
    } catch {
      setToast({ msg: "Erro de conexão.", tipo: "erro" });
    } finally {
      setImportando(false);
    }
  }

  const validas = preview?.filter((l) => !l.erro).length ?? 0;
  const comErro = preview?.filter((l) => l.erro).length ?? 0;

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Exportar — qualquer logado */}
        <button
          onClick={handleExportar}
          disabled={!competenciaId}
          style={{
            padding: "7px 14px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            color: competenciaId ? "#374151" : "#9ca3af",
            cursor: competenciaId ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ↓ Exportar Excel
        </button>

        {/* Importar — só admin */}
        {isAdmin && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!competenciaId}
              style={{
                padding: "7px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: "#fff",
                color: competenciaId ? "#374151" : "#9ca3af",
                cursor: competenciaId ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ↑ Importar CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleArquivo}
              style={{ display: "none" }}
            />
          </>
        )}
      </div>

      {/* Modal de preview */}
      {preview && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPreview(null); }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 24,
              width: "100%",
              maxWidth: 900,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
              Pré-visualização da importação
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              <span style={{ color: "#15803d", fontWeight: 600 }}>{validas} válidas</span>
              {comErro > 0 && (
                <span style={{ color: "#b91c1c", fontWeight: 600 }}> · {comErro} com erro (serão ignoradas)</span>
              )}
              {" · "}{preview.length} linhas encontradas
            </p>

            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: "#111827", color: "#fff", textAlign: "left", position: "sticky", top: 0 }}>
                    <th style={{ padding: "6px 8px" }}>#</th>
                    <th style={{ padding: "6px 8px" }}>Status</th>
                    <th style={{ padding: "6px 8px" }}>Cliente</th>
                    <th style={{ padding: "6px 8px" }}>Cidade</th>
                    <th style={{ padding: "6px 8px" }}>Região</th>
                    <th style={{ padding: "6px 8px" }}>Atendente</th>
                    <th style={{ padding: "6px 8px" }}>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((l, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: l.erro ? "#fef2f2" : i % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "6px 8px", color: "#6b7280" }}>{i + 1}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 600, color: STATUS_COR[l.status] ?? "#111827" }}>
                        {l.status}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#111827" }}>{l.nomeCliente}</td>
                      <td style={{ padding: "6px 8px", color: l.cidade ? "#111827" : "#b91c1c" }}>
                        {l.cidade || l.cidadeOriginal}
                      </td>
                      <td style={{ padding: "6px 8px", color: l.regiao ? "#111827" : "#b91c1c" }}>
                        {l.regiao || l.regiaoOriginal}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#111827" }}>{l.atendenteNome}</td>
                      <td style={{ padding: "6px 8px", color: "#b91c1c", fontSize: 11 }}>
                        {l.erro ?? "✓"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPreview(null)}
                style={{
                  padding: "8px 18px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarImportacao}
                disabled={importando || validas === 0}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 6,
                  background: importando || validas === 0 ? "#9ca3af" : "#15803d",
                  color: "#fff",
                  cursor: importando || validas === 0 ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {importando ? "Importando..." : `Importar ${validas} solicitações`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          mensagem={toast.msg}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
