"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./perfis-actions";

export function NovoPerfilForm({
  criarPerfilAction,
}: {
  criarPerfilAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarPerfilAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="papel">
          Função *
        </label>
        <select
          id="papel"
          name="papel"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="ATENDENTE">Atendente</option>
          <option value="GERENTE">Gerente</option>
        </select>
      </div>

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
          E-mail (login) *
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

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Adicionar à equipe"}
      </button>
    </form>
  );
}
