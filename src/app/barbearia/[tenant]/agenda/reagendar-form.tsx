"use client";

import { useActionState, useState } from "react";
import type { EstadoReagendamento } from "./actions";

export function ReagendarForm({
  reagendarAction,
}: {
  reagendarAction: (
    estado: EstadoReagendamento,
    formData: FormData
  ) => Promise<EstadoReagendamento>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(reagendarAction, undefined);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-xs text-neutral-600 hover:text-neutral-900 hover:underline"
      >
        Reagendar
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="date" name="data" required className="rounded border px-2 py-1 text-xs" />
      <input type="time" name="hora" required className="rounded border px-2 py-1 text-xs" />
      <button
        type="submit"
        disabled={pendente}
        className="text-xs text-white bg-neutral-900 rounded px-2 py-1 disabled:opacity-50"
      >
        {pendente ? "..." : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className="text-xs text-neutral-400"
      >
        Cancelar
      </button>
      {estado?.erro && <span className="text-xs text-red-500">{estado.erro}</span>}
    </form>
  );
}
