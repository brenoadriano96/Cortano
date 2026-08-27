"use client";

import { useState, useTransition } from "react";

export function EditorComissao({
  barbeiroId,
  servicoId,
  servicoNome,
  comissaoAtual,
  atualizarComissaoAction,
}: {
  barbeiroId: string;
  servicoId: string;
  servicoNome: string;
  comissaoAtual: number | null;
  atualizarComissaoAction: (
    barbeiroId: string,
    servicoId: string,
    comissao: number
  ) => Promise<void>;
}) {
  const [valor, setValor] = useState(comissaoAtual ?? 0);
  const [pendente, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-neutral-500">{servicoNome}:</span>
      <input
        type="number"
        min={0}
        max={100}
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        className="w-14 rounded border px-1 py-0.5 text-xs text-right"
      />
      <span className="text-neutral-400">%</span>
      <button
        disabled={pendente || valor === (comissaoAtual ?? 0)}
        onClick={() =>
          startTransition(() => atualizarComissaoAction(barbeiroId, servicoId, valor))
        }
        className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
      >
        Salvar
      </button>
    </div>
  );
}
