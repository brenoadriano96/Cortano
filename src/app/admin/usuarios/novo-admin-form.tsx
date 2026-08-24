"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovoAdminForm({
  criarUsuarioAdminAction,
}: {
  criarUsuarioAdminAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarUsuarioAdminAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo administrador</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="email">
          E-mail *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="senha">
          Senha inicial *
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={6}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <p className="text-xs text-neutral-400">
        Este usuário terá acesso global ao Cortano Admin (seção 4.1).
      </p>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Criar administrador"}
      </button>
    </form>
  );
}
