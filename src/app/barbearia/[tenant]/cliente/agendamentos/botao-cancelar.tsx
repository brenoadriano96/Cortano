"use client";

import { useTransition } from "react";

export function BotaoCancelar({
  agendamentoId,
  cancelarAction,
}: {
  agendamentoId: string;
  cancelarAction: (agendamentoId: string) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  return (
    <button
      disabled={pendente}
      onClick={() => startTransition(() => cancelarAction(agendamentoId))}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pendente ? "Cancelando..." : "Cancelar"}
    </button>
  );
}
