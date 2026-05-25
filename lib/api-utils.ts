import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Wrapper padrão para API routes.
 * - Loga o erro real no servidor
 * - Retorna mensagem útil pro cliente
 * - Trata ZodError separadamente (422 com detalhes dos campos)
 *
 * Espelhado em crm-comercial-fenix/lib/api-utils.ts — manter sincronizado.
 */
export function apiError(error: unknown, contexto: string) {
  console.error(`[API] ${contexto}:`, error);

  if (error instanceof ZodError) {
    const campos = error.issues.map((e) => ({
      campo: e.path.join("."),
      mensagem: e.message,
    }));
    return NextResponse.json(
      { error: "Dados inválidos", campos },
      { status: 422 }
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Registro duplicado. Já existe um registro com esses dados." },
      { status: 409 }
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  ) {
    return NextResponse.json(
      { error: "Registro não encontrado." },
      { status: 404 }
    );
  }

  const mensagem =
    error instanceof Error ? error.message : "Erro interno do servidor";
  return NextResponse.json({ error: mensagem }, { status: 500 });
}
