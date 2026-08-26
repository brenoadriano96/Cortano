"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { autenticar } from "./actions";

function LoginForm() {
  const [estado, formAction, pendente] = useActionState(autenticar, undefined);
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-white text-neutral-950 flex items-center justify-center text-lg font-bold mx-auto mb-3">
            C
          </div>
          <h1 className="text-white text-xl font-semibold">Entrar no Cortano</h1>
        </div>

        <form action={formAction} className="bg-neutral-900 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="••••••••"
            />
          </div>

          {estado?.erro && (
            <p className="text-red-400 text-sm">{estado.erro}</p>
          )}

          <button
            type="submit"
            disabled={pendente}
            className="w-full bg-white text-neutral-950 rounded-md py-2 text-sm font-medium disabled:opacity-60"
          >
            {pendente ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {tenantSlug && (
          <p className="text-center text-neutral-500 text-sm mt-4">
            Ainda não tem conta?{" "}
            <a
              href={`/barbearia/${tenantSlug}/cadastro-cliente`}
              className="text-white hover:underline"
            >
              Criar conta
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
