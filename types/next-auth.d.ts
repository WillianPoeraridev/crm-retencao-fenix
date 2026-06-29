import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "ATENDENTE";
      name?: string | null;
      email?: string | null;
      tenantId: string;
      tenantSlug: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "ATENDENTE";
    tenantId: string;
    tenantSlug: string;
  }
}
