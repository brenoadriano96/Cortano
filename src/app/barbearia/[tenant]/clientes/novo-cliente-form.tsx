"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovoClienteForm({
  criarClienteAction,
}: {
  criarClienteAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarClienteAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo cliente</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Nome completo"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="telefone">
          Telefone
        </label>
        <input
          id="telefone"
          name="telefone"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="(00) 00000-0000"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="cliente@email.com"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Adicionar cliente"}
      </button>
    </form>
  );
}
