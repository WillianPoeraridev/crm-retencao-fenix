"use client";

import { useRouter, usePathname } from "next/navigation";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  ano: number;
  mes: number;
  temCompetencia: boolean;
}

export function SeletorCompetencia({ ano, mes, temCompetencia }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function navegar(deltaMs: number) {
    // calcula o mês destino somando delta (-1 ou +1)
    const data = new Date(ano, mes - 1 + deltaMs, 1);
    const novoAno = data.getFullYear();
    const novoMes = data.getMonth() + 1;
    router.push(`${pathname}?ano=${novoAno}&mes=${novoMes}`);
  }

  const agora = new Date();
  const ehMesAtual = ano === agora.getFullYear() && mes === agora.getMonth() + 1;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => navegar(-1)}
        title="Mês anterior"
        style={{ ...estiloBtn, alignSelf: "flex-start" }}
      >
        ←
      </button>

      <div style={{ textAlign: "center", width: 200 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>
          {MESES[mes - 1]} {ano}
        </div>
        <div style={{ fontSize: 13, marginTop: 2, height: 18 }}>
          {!temCompetencia && (
            <span style={{ color: "var(--warning-strong)" }}>sem dados cadastrados</span>
          )}
        </div>
      </div>

      <button
        onClick={() => navegar(+1)}
        title="Próximo mês"
        style={{ ...estiloBtn, alignSelf: "flex-start" }}
      >
        →
      </button>

      {!ehMesAtual && (
        <button
          onClick={() => router.push(pathname)}
          title="Voltar ao mês atual"
          style={{ ...estiloBtn, fontSize: 11, padding: "4px 10px", color: "var(--primary)", borderColor: "var(--primary)", alignSelf: "flex-start", marginTop: 1 }}
        >
          hoje
        </button>
      )}
    </div>
  );
}

const estiloBtn: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid var(--border-strong)",
  borderRadius: 6,
  background: "var(--surface)",
  cursor: "pointer",
  fontSize: 16,
  color: "var(--fg-secondary)",
  lineHeight: 1,
};