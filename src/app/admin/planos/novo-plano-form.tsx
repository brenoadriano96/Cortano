"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovoPlanoForm({
  criarPlanoAction,
}: {
  criarPlanoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarPlanoAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo plano</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Start, Pro, Premium..."
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="precoMensal">
          Preço mensal (R$) *
        </label>
        <input
          id="precoMensal"
          name="precoMensal"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <p className="text-xs text-neutral-400">
        Deixe em branco para limite ilimitado (seção 8: Premium = ilimitado).
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="maxBarbeiros">
            Máx. barbeiros
          </label>
          <input
            id="maxBarbeiros"
            name="maxBarbeiros"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="maxUsuarios">
            Máx. usuários
          </label>
          <input
            id="maxUsuarios"
            name="maxUsuarios"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="maxClientes">
            Máx. clientes
          </label>
          <input
            id="maxClientes"
            name="maxClientes"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="maxProdutos">
            Máx. produtos
          </label>
          <input
            id="maxProdutos"
            name="maxProdutos"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Criar plano"}
      </button>
    </form>
  );
}
