"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovoServicoForm({
  criarServicoAction,
}: {
  criarServicoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarServicoAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo serviço</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Ex: Corte, Barba, Corte + Barba"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="preco">
            Preço (R$) *
          </label>
          <input
            id="preco"
            name="preco"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="45.00"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="duracaoMin">
            Duração (min) *
          </label>
          <input
            id="duracaoMin"
            name="duracaoMin"
            type="number"
            min="1"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="30"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="descricao">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
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
        {pendente ? "Salvando..." : "Adicionar serviço"}
      </button>
    </form>
  );
}
