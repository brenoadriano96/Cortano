"use client";

import { useTransition } from "react";

const STATUS_OPCOES = [
  { value: "NOVO", label: "Novo" },
  { value: "CONTATADO", label: "Contatado" },
  { value: "VISITA_AGENDADA", label: "Visita agendada" },
  { value: "EM_NEGOCIACAO", label: "Em negociação" },
  { value: "GANHO", label: "Ganho" },
  { value: "PERDIDO", label: "Perdido" },
] as const;

export function SeletorStatusProspecto({
  prospectoId,
  statusAtual,
  atualizarStatusAction,
}: {
  prospectoId: string;
  statusAtual: string;
  atualizarStatusAction: (
    prospectoId: string,
    novoStatus: (typeof STATUS_OPCOES)[number]["value"]
  ) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  return (
    <select
      defaultValue={statusAtual}
      disabled={pendente}
      onChange={(e) => {
        const novo = e.target.value as (typeof STATUS_OPCOES)[number]["value"];
        startTransition(() => atualizarStatusAction(prospectoId, novo));
      }}
      className="text-xs border rounded px-2 py-1 disabled:opacity-50"
    >
      {STATUS_OPCOES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
