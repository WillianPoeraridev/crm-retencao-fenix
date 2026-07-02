"use client";

import { useRouter } from "next/navigation";
import { useTenantEvent } from "@/lib/use-tenant-event";

export function RetencaoRealtime() {
  const router = useRouter();

  // Só reage a eventos de retenção do próprio tenant. Ver useTenantEvent.
  useTenantEvent("retencao-changes", "SolicitacaoRetencaoEvent", () => router.refresh());

  return null;
}
