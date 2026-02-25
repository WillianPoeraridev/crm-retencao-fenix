"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Não renderiza na tela de login
  if (status === "loading" || !session || pathname === "/login") return null;

  const isAdmin = session.user.role === "ADMIN";

  return (
    <nav
      style={{
        backgroundColor: "#111827",
        color: "#fff",
        padding: "0 24px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Esquerda: logo + links */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link
          href="/retencao"
          style={{ fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "none", letterSpacing: "0.01em" }}
        >
          🔥 Fênix CRM
        </Link>

        <div style={{ display: "flex", gap: 4 }}>
          <NavLink href="/retencao" atual={pathname.startsWith("/retencao")}>
            Retenção
          </NavLink>
          {isAdmin && (
            <NavLink href="/admin" atual={pathname.startsWith("/admin")}>
              Admin
            </NavLink>
          )}
        </div>
      </div>

      {/* Direita: usuário + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>
          {session.user.name}
          {isAdmin && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                backgroundColor: "#2563eb",
                color: "#fff",
                padding: "1px 6px",
                borderRadius: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Admin
            </span>
          )}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "4px 12px",
            border: "1px solid #374151",
            borderRadius: 5,
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  atual,
  children,
}: {
  href: string;
  atual: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "4px 12px",
        borderRadius: 5,
        fontSize: 13,
        fontWeight: atual ? 600 : 400,
        color: atual ? "#fff" : "#9ca3af",
        backgroundColor: atual ? "#1f2937" : "transparent",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}