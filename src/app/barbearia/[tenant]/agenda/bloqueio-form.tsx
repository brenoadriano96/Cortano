"use client";

import { useActionState } from "react";
import type { EstadoBloqueio } from "./actions";

type Opcao = { id: string; nome: string };

export function BloqueioForm({
  criarBloqueioAction,
  barbeiros,
  dataSelecionada,
}: {
  criarBloqueioAction: (estado: EstadoBloqueio, formData: FormData) => Promise<EstadoBloqueio>;
  barbeiros: Opcao[];
  dataSelecionada: string;
}) {
  const [estado, formAction, pendente] = useActionState(criarBloqueioAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium text-sm">Bloquear horário</h2>
      <p className="text-xs text-neutral-400">Folga, almoço, feriado...</p>

      <select
        name="barbeiroId"
        required
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Barbeiro...</option>
        {barbeiros.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nome}
          </option>
        ))}
      </select>

      <input
        type="date"
        name="data"
        defaultValue={dataSelecionada}
        required
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          name="horaInicio"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="time"
          name="horaFim"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <input
        type="text"
        name="motivo"
        placeholder="Motivo (opcional)"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-100 text-neutral-900 border rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Bloquear"}
      </button>
    </form>
  );
}
