import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminCompetencias } from "./admin-competencias";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/retencao?forbidden=1");
  }

  // Busca todas as competências ordenadas da mais recente
  const competencias = await prisma.competencia.findMany({
    orderBy: [{ ano: "desc" }, { mes: "desc" }],
  });

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            Painel Administrativo
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
            Logado como <strong>{session.user.name}</strong>
          </p>
        </div>
      </div>

      <AdminCompetencias competencias={competencias} />
    </main>
  );
}