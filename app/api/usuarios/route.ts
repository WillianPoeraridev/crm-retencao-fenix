import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const existente = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (existente) {
    return NextResponse.json(
      { error: "Já existe um usuário com este email." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "ATENDENTE",
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}