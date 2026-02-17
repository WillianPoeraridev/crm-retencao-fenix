import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "ATENDENTE";
      name?: string | null;
      email?: string | null;
    };
  }
}
