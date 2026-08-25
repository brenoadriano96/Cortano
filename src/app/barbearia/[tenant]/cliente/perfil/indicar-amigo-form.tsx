"use client";

import { useActionState } from "react";
import type { EstadoIndicacao } from "./actions";

export function IndicarAmigoForm({
  indicarAmigoAction,
}: {
  indicarAmigoAction: (
    estado: EstadoIndicacao,
    formData: FormData
  ) => Promise<EstadoIndicacao>;
}) {
  const [estado, formAction, pendente] = useActionState(indicarAmigoAction, undefined);

  if (estado?.sucesso) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <p className="font-medium mb-1">Indicação enviada!</p>
        <p className="text-sm text-neutral-500">
          Quando seu amigo virar cliente, você recebe cashback.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3 max-w-md">
      <p className="text-sm text-neutral-500 mb-1">
        Indique um amigo e ganhe cashback quando ele se tornar cliente.
      </p>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nomeIndicado">
          Nome do amigo *
        </label>
        <input
          id="nomeIndicado"
          name="nomeIndicado"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="telefoneIndicado">
          Telefone do amigo *
        </label>
        <input
          id="telefoneIndicado"
          name="telefoneIndicado"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Enviando..." : "Indicar amigo"}
      </button>
    </form>
  );
}
