"use client";

import { useState, useTransition } from "react";

export function EditorEstoque({
  produtoId,
  estoqueAtual,
  atualizarEstoqueAction,
}: {
  produtoId: string;
  estoqueAtual: number;
  atualizarEstoqueAction: (produtoId: string, novoEstoque: number) => Promise<void>;
}) {
  const [valor, setValor] = useState(estoqueAtual);
  const [pendente, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 justify-end">
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        className="w-16 rounded border px-2 py-1 text-xs text-right"
      />
      <button
        disabled={pendente || valor === estoqueAtual}
        onClick={() => startTransition(() => atualizarEstoqueAction(produtoId, valor))}
        className="text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
      >
        Salvar
      </button>
    </div>
  );
}
