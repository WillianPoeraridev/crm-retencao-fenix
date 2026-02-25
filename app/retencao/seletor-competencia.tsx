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
        style={estiloBtn}
      >
        ←
      </button>

      <div style={{ textAlign: "center", minWidth: 180 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
          {MESES[mes - 1]} {ano}
        </div>
        {!temCompetencia && (
          <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>
            sem dados cadastrados
          </div>
        )}
        {ehMesAtual && (
          <div style={{ fontSize: 11, color: "#2563eb", marginTop: 2 }}>
            mês atual
          </div>
        )}
      </div>

      <button
        onClick={() => navegar(+1)}
        title="Próximo mês"
        style={estiloBtn}
      >
        →
      </button>

      {!ehMesAtual && (
        <button
          onClick={() => router.push(pathname)}
          title="Voltar ao mês atual"
          style={{ ...estiloBtn, fontSize: 11, padding: "4px 10px", color: "#2563eb", borderColor: "#2563eb" }}
        >
          hoje
        </button>
      )}
    </div>
  );
}

const estiloBtn: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 16,
  color: "#374151",
  lineHeight: 1,
};