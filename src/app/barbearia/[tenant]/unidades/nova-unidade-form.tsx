"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovaUnidadeForm({
  criarUnidadeAction,
}: {
  criarUnidadeAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarUnidadeAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Nova unidade</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Unidade Centro"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="endereco">
          Endereço
        </label>
        <input
          id="endereco"
          name="endereco"
          className="w-full rounded-md border px-3 py-2 text-sm"
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
        />
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Adicionar unidade"}
      </button>
    </form>
  );
}
