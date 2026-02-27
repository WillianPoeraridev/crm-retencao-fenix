import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminCompetencias } from "./admin-competencias";
import { AdminUsuarios } from "./admin-usuarios";
import { AdminCidades } from "./admin-cidades";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/retencao?forbidden=1");
  }

  const [competencias, usuarios, cidades] = await Promise.all([
    prisma.competencia.findMany({
      orderBy: [{ ano: "desc" }, { mes: "desc" }],
    }),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, isActive: true },
    }),
    prisma.cidade.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, isActive: true },
    }),
  ]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
          Painel Administrativo
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
          Logado como <strong>{session.user.name}</strong>
        </p>
      </div>

      <AdminCompetencias competencias={competencias} />
      <AdminCidades cidades={cidades} />
      <AdminUsuarios usuarios={usuarios} sessaoId={session.user.id} />
    </main>
  );
}