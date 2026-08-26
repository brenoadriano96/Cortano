"use client";

import { useActionState } from "react";
import type { EstadoCadastro } from "./actions";

export function CadastroClienteForm({
  cadastrarClienteAction,
}: {
  cadastrarClienteAction: (
    estado: EstadoCadastro,
    formData: FormData
  ) => Promise<EstadoCadastro>;
}) {
  const [estado, formAction, pendente] = useActionState(cadastrarClienteAction, undefined);

  return (
    <form action={formAction} className="bg-neutral-900 rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm text-neutral-400 mb-1" htmlFor="nome">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1" htmlFor="telefone">
          Telefone
        </label>
        <input
          id="telefone"
          name="telefone"
          required
          className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          placeholder="(00) 00000-0000"
        />
      </div>

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
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      {estado?.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-white text-neutral-950 rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
