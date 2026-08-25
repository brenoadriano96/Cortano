"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovoCupomForm({
  criarCupomAction,
}: {
  criarCupomAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarCupomAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="codigo">
          Código *
        </label>
        <input
          id="codigo"
          name="codigo"
          required
          className="w-full rounded-md border px-3 py-2 text-sm uppercase"
          placeholder="BEMVINDO10"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="tipo">
            Tipo *
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="PERCENTUAL">% desconto</option>
            <option value="VALOR_FIXO">R$ fixo</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="valor">
            Valor *
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="validoAte">
            Válido até
          </label>
          <input
            id="validoAte"
            name="validoAte"
            type="date"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="usoMaximo">
            Usos máx.
          </label>
          <input
            id="usoMaximo"
            name="usoMaximo"
            type="number"
            min="1"
            placeholder="Ilimitado"
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
        {pendente ? "Salvando..." : "Criar cupom"}
      </button>
    </form>
  );
}
