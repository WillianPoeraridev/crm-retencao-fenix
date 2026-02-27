"use client";

import { useEffect } from "react";

interface Props {
  mensagem: string;
  tipo?: "sucesso" | "erro";
  onClose: () => void;
}

export function Toast({ mensagem, tipo = "sucesso", onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = tipo === "sucesso" ? "#15803d" : "#b91c1c";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        padding: "12px 20px",
        borderRadius: 8,
        backgroundColor: bg,
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        zIndex: 60,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {mensagem}
    </div>
  );
}