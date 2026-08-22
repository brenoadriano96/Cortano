import { PapelUsuario } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    papel: PapelUsuario;
    tenantId: string | null;
  }

  interface Session {
    user: {
      id: string;
      papel: PapelUsuario;
      tenantId: string | null;
    } & DefaultSessionUser;
  }
}

// Reaproveita os campos padrão (name, email, image) do tipo original
type DefaultSessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

declare module "next-auth/jwt" {
  interface JWT {
    papel?: PapelUsuario;
    tenantId?: string | null;
  }
}
