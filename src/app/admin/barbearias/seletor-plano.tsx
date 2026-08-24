"use client";

import { useTransition } from "react";

type PlanoOpcao = { id: string; nome: string };

export function SeletorPlano({
  tenantId,
  planoAtualId,
  planos,
  alterarPlanoAction,
}: {
  tenantId: string;
  planoAtualId: string | null;
  planos: PlanoOpcao[];
  alterarPlanoAction: (tenantId: string, novoPlanoId: string) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  return (
    <select
      defaultValue={planoAtualId ?? ""}
      disabled={pendente}
      onChange={(e) => {
        const novoPlanoId = e.target.value;
        if (novoPlanoId && novoPlanoId !== planoAtualId) {
          startTransition(() => alterarPlanoAction(tenantId, novoPlanoId));
        }
      }}
      className="text-xs border rounded px-2 py-1 disabled:opacity-50"
    >
      <option value="" disabled>
        Sem plano
      </option>
      {planos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome}
        </option>
      ))}
    </select>
  );
}
