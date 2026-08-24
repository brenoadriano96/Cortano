"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function ConfiguracaoForm({
  atualizarConfiguracaoAction,
  trialDiasAtual,
  suporteEmailAtual,
}: {
  atualizarConfiguracaoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  trialDiasAtual: number;
  suporteEmailAtual: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(
    atualizarConfiguracaoAction,
    undefined
  );

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3 max-w-md">
      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="trialDiasPadrao">
          Dias de trial padrão para novas barbearias
        </label>
        <input
          id="trialDiasPadrao"
          name="trialDiasPadrao"
          type="number"
          min="1"
          required
          defaultValue={trialDiasAtual}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="suporteEmail">
          E-mail de suporte
        </label>
        <input
          id="suporteEmail"
          name="suporteEmail"
          type="email"
          defaultValue={suporteEmailAtual ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="suporte@cortano.com"
        />
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}
      {estado?.sucesso && <p className="text-green-600 text-xs">Configurações salvas!</p>}

      <button
        type="submit"
        disabled={pendente}
        className="bg-neutral-900 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
