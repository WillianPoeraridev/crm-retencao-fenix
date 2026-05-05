const brlFull = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlInt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** R$ 99,90 */
export function fmtBRL(value: number): string {
  return brlFull.format(value);
}

/** R$ 100 (sem centavos) */
export function fmtBRLInt(value: number): string {
  return brlInt.format(value);
}

/** Calcula (value/total)*100 e retorna "85,50%" — retorna "0,00%" se total===0 */
export function fmtPct(value: number, total: number): string {
  if (total === 0) return "0,00%";
  return pctFmt.format((value / total) * 100) + "%";
}

/**
 * Nome curto do atendente: primeiro nome + inicial do sobrenome.
 * "Willian Poerari" → "Willian P", "Lucas" → "Lucas", "" → "—".
 * Útil para diferenciar atendentes com mesmo primeiro nome.
 */
export function shortName(fullName: string | null | undefined): string {
  if (!fullName) return "—";
  const partes = fullName.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "—";
  if (partes.length === 1) return partes[0];
  const inicial = partes[1][0]?.toUpperCase() ?? "";
  return inicial ? `${partes[0]} ${inicial}` : partes[0];
}
