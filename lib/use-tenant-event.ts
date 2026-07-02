"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

// Espelhado em crm-comercial-fenix/lib/use-tenant-event.ts — manter sincronizado.
type EvTable = "ComercialEvent" | "SolicitacaoRetencaoEvent";
type Row = Record<string, unknown>;

function field(payload: RealtimePostgresChangesPayload<Row>, key: string): string | undefined {
  const n = payload.new as Row;
  const o = payload.old as Row;
  const v = (n && key in n ? n[key] : undefined) ?? (o && key in o ? o[key] : undefined);
  return typeof v === "string" ? v : undefined;
}

/**
 * Assina uma event table do Realtime, só chamando `onEvent` para eventos do
 * PRÓPRIO tenant (filtro client-side pelo tenantId do payload). Anon recebe pings
 * de todos os tenants; ignoramos os alheios. Isolamento = metadado-only + este
 * filtro + RLS forçada no dado de negócio. Ver docs/adr/0002-realtime-multi-tenant.md.
 */
export function useTenantEvent(
  channelName: string,
  table: EvTable,
  onEvent: () => void,
  entity?: string,
) {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    const client = supabase;
    if (!client || !tenantId) return;

    const channel = client
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "shared", table },
        (payload: RealtimePostgresChangesPayload<Row>) => {
          if (field(payload, "tenantId") !== tenantId) return;
          if (entity && field(payload, "entity") !== entity) return;
          cb.current();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [channelName, table, tenantId, entity]);
}
