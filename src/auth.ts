import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credenciaisSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, senha } = parsed.data;

        const usuario = await prisma.usuario.findFirst({
          where: { email, ativo: true },
        });
        if (!usuario || !usuario.senhaHash) return null;

        const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
        if (!senhaValida) return null;

        // Regra da seção 11: bloquear login se a barbearia estiver
        // suspensa/cancelada (Super Admin, sem tenantId, nunca é bloqueado aqui)
        if (usuario.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: usuario.tenantId },
          });
          if (tenant && (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED")) {
            return null;
          }
        }

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          papel: usuario.papel,
          tenantId: usuario.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    // Propaga papel e tenantId do usuário autenticado para o token JWT
    async jwt({ token, user }) {
      if (user) {
        token.papel = user.papel;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    // Expõe papel e tenantId na sessão (usado por RBAC e pelo middleware)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.papel = token.papel as string;
        session.user.tenantId = token.tenantId as string | null;
      }
      return session;
    },
  },
});
