"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovoProspectoForm({
  criarProspectoAction,
}: {
  criarProspectoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarProspectoAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo prospecto</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome da barbearia *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="contatoNome">
          Nome do contato
        </label>
        <input
          id="contatoNome"
          name="contatoNome"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="origem">
            Origem
          </label>
          <input
            id="origem"
            name="origem"
            placeholder="Indicação, Instagram..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="valorEstimado">
            MRR estimado (R$)
          </label>
          <input
            id="valorEstimado"
            name="valorEstimado"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
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
        {pendente ? "Salvando..." : "Adicionar prospecto"}
      </button>
    </form>
  );
}
