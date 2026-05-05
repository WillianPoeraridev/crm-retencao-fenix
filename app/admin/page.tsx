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
    <main style={{ padding: "16px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            Painel Administrativo
          </h1>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            backgroundColor: "rgba(249,115,22,0.1)",
            color: "#f97316",
            padding: "2px 7px",
            borderRadius: 20,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            Admin
          </span>
        </div>
        <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
          Logado como <strong style={{ color: "#374151" }}>{session.user.name}</strong>
        </p>
      </div>

      <AdminCompetencias competencias={competencias} />
      <AdminCidades cidades={cidades} />
      <AdminUsuarios usuarios={usuarios} sessaoId={session.user.id} />
    </main>
  );
}