"use client";

import { useTransition } from "react";

type StatusAgendamento = "AGENDADO" | "CONFIRMADO" | "ATENDIDO" | "CANCELADO" | "FALTOU";

export function AcoesAgendamento({
  agendamentoId,
  statusAtual,
  atualizarStatusAction,
}: {
  agendamentoId: string;
  statusAtual: StatusAgendamento;
  atualizarStatusAction: (
    agendamentoId: string,
    novoStatus: "CONFIRMADO" | "ATENDIDO" | "CANCELADO" | "FALTOU"
  ) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  const acoesDisponiveis: { label: string; status: "CONFIRMADO" | "ATENDIDO" | "CANCELADO" | "FALTOU" }[] =
    statusAtual === "AGENDADO"
      ? [
          { label: "Confirmar", status: "CONFIRMADO" },
          { label: "Cancelar", status: "CANCELADO" },
        ]
      : statusAtual === "CONFIRMADO"
      ? [
          { label: "Atendido", status: "ATENDIDO" },
          { label: "Faltou", status: "FALTOU" },
          { label: "Cancelar", status: "CANCELADO" },
        ]
      : [];

  if (acoesDisponiveis.length === 0) return null;

  return (
    <div className="flex gap-2">
      {acoesDisponiveis.map((a) => (
        <button
          key={a.status}
          disabled={pendente}
          onClick={() =>
            startTransition(() => {
              atualizarStatusAction(agendamentoId, a.status);
            })
          }
          className="text-xs text-neutral-600 hover:text-neutral-900 hover:underline disabled:opacity-50"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
