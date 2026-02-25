import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive, password } = body;

  const existente = await prisma.user.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  // Não permite desativar a própria conta
  if (id === session.user.id && isActive === false) {
    return NextResponse.json(
      { error: "Você não pode desativar sua própria conta." },
      { status: 400 }
    );
  }

  const data: { isActive?: boolean; passwordHash?: string } = {};

  if (isActive !== undefined) {
    data.isActive = isActive;
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const atualizado = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json(atualizado);
}