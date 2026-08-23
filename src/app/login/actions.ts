"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type EstadoLogin = { erro?: string } | undefined;

/**
 * Autentica o usuário. O redirecionamento por papel (seção 23) acontece
 * em /post-login, porque a sessão só fica disponível de forma confiável
 * na PRÓXIMA requisição após o signIn — tentar ler auth() na mesma
 * execução do signIn (mesmo com redirect: false) retorna sessão vazia.
 */
export async function autenticar(
  _estadoAnterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirectTo: "/post-login",
    });
  } catch (error) {
    // NEXT_REDIRECT não é um erro de fato — é como o Next.js sinaliza o
    // redirecionamento bem-sucedido do signIn. Deixa propagar normalmente.
    if (error && typeof error === "object" && "digest" in error) {
      const digest = (error as { digest?: string }).digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    if (error instanceof AuthError) {
      return { erro: "E-mail ou senha inválidos." };
    }
    throw error;
  }
  return undefined;
}


