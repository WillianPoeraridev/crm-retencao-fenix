"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export function RetencaoRealtime() {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("retencao-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "shared", table: "SolicitacaoRetencaoEvent" },
        (payload) => {
          console.log("[realtime] retencao evento recebido:", payload); // DIAGNÓSTICO TEMPORÁRIO
          router.refresh();
        },
      )
      .subscribe((status) => {
        console.log("[realtime] retencao status do canal:", status); // DIAGNÓSTICO TEMPORÁRIO
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [router]);

  return null;
}
