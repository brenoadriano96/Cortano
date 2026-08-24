"use client";

import { useState, useTransition } from "react";
import type { EstadoCarrinho } from "./actions";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
};

export function CatalogoComCarrinho({
  produtos,
  finalizarPedidoAction,
}: {
  produtos: Produto[];
  finalizarPedidoAction: (
    itens: { produtoId: string; quantidade: number }[]
  ) => Promise<EstadoCarrinho>;
}) {
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [estado, setEstado] = useState<EstadoCarrinho>(undefined);
  const [pendente, startTransition] = useTransition();

  const itensCarrinho = Object.entries(carrinho).filter(([, qtd]) => qtd > 0);
  const total = itensCarrinho.reduce((acc, [produtoId, qtd]) => {
    const produto = produtos.find((p) => p.id === produtoId);
    return acc + (produto ? produto.preco * qtd : 0);
  }, 0);

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((prev) => {
      const atual = prev[produtoId] ?? 0;
      const produto = produtos.find((p) => p.id === produtoId);
      const max = produto?.estoque ?? 0;
      const novo = Math.min(Math.max(atual + delta, 0), max);
      return { ...prev, [produtoId]: novo };
    });
  }

  function finalizar() {
    const itens = itensCarrinho.map(([produtoId, quantidade]) => ({
      produtoId,
      quantidade,
    }));
    startTransition(async () => {
      const resultado = await finalizarPedidoAction(itens);
      setEstado(resultado);
      if (resultado?.sucesso) {
        setCarrinho({});
      }
    });
  }

  if (estado?.sucesso) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <p className="font-medium mb-1">Pedido realizado!</p>
        <p className="text-sm text-neutral-500">
          Acompanhe em &quot;Meus Pedidos&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {produtos.map((p) => {
          const qtd = carrinho[p.id] ?? 0;
          return (
            <div key={p.id} className="bg-white rounded-lg border p-4">
              <p className="text-xs text-neutral-400">{p.categoria}</p>
              <p className="font-medium">{p.nome}</p>
              <p className="text-sm text-neutral-500 mb-3">
                R$ {p.preco.toFixed(2)}{" "}
                {p.estoque === 0 && (
                  <span className="text-red-500 text-xs">(sem estoque)</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alterarQuantidade(p.id, -1)}
                  disabled={qtd === 0}
                  className="w-7 h-7 rounded border text-sm disabled:opacity-30"
                >
                  −
                </button>
                <span className="text-sm w-6 text-center">{qtd}</span>
                <button
                  onClick={() => alterarQuantidade(p.id, 1)}
                  disabled={qtd >= p.estoque}
                  className="w-7 h-7 rounded border text-sm disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        {produtos.length === 0 && (
          <p className="text-neutral-400 text-sm col-span-full text-center py-6">
            Nenhum produto disponível no momento.
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg border p-4 h-fit sticky top-4">
        <h2 className="font-medium mb-3">Carrinho</h2>
        {itensCarrinho.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum item selecionado.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {itensCarrinho.map(([produtoId, qtd]) => {
              const produto = produtos.find((p) => p.id === produtoId)!;
              return (
                <div key={produtoId} className="flex justify-between text-sm">
                  <span>
                    {qtd}x {produto.nome}
                  </span>
                  <span>R$ {(produto.preco * qtd).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="border-t pt-2 flex justify-between font-medium text-sm">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {estado?.erro && <p className="text-red-500 text-xs mb-2">{estado.erro}</p>}

        <button
          onClick={finalizar}
          disabled={itensCarrinho.length === 0 || pendente}
          className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {pendente ? "Finalizando..." : "Finalizar pedido"}
        </button>
      </div>
    </div>
  );
}
