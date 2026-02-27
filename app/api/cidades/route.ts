import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — lista cidades ativas (qualquer usuário logado)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cidades = await prisma.cidade.findMany({
    where: { isActive: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, isActive: true },
  });

  return NextResponse.json(cidades);
}

// POST — cria nova cidade (ADMIN only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const { id, nome } = body;

  if (!id || !nome) {
    return NextResponse.json(
      { error: "Código e nome são obrigatórios." },
      { status: 400 }
    );
  }

  // Normaliza o código: maiúsculo, sem espaços, underscores
  const codigo = id
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

  if (!codigo) {
    return NextResponse.json(
      { error: "Código inválido." },
      { status: 400 }
    );
  }

  const existente = await prisma.cidade.findUnique({ where: { id: codigo } });
  if (existente) {
    return NextResponse.json(
      { error: "Já existe uma cidade com este código." },
      { status: 409 }
    );
  }

  const cidade = await prisma.cidade.create({
    data: {
      id: codigo,
      nome: nome.trim(),
    },
  });

  return NextResponse.json(cidade, { status: 201 });
}