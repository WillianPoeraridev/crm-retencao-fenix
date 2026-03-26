"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export function RetencaoRealtime() {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("retencao-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "SolicitacaoRetencao" },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
