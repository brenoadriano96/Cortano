"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function NovaCategoriaForm({
  criarCategoriaAction,
}: {
  criarCategoriaAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(criarCategoriaAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-2">
      <h2 className="font-medium text-sm">Nova categoria</h2>
      <div className="flex gap-2">
        <input
          name="nomeCategoria"
          required
          placeholder="Ex: Óleos para barba"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pendente}
          className="bg-neutral-100 border text-neutral-900 rounded-md px-3 py-2 text-sm disabled:opacity-60"
        >
          {pendente ? "..." : "Criar"}
        </button>
      </div>
      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}
    </form>
  );
}
