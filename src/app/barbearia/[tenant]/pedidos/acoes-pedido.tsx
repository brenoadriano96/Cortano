"use client";

import { useTransition } from "react";

export function AcoesPedido({
  pedidoId,
  podeAvancar,
  podeCancelar,
  avancarAction,
  cancelarAction,
}: {
  pedidoId: string;
  podeAvancar: boolean;
  podeCancelar: boolean;
  avancarAction: (pedidoId: string) => Promise<void>;
  cancelarAction: (pedidoId: string) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {podeAvancar && (
        <button
          disabled={pendente}
          onClick={() => startTransition(() => avancarAction(pedidoId))}
          className="text-xs text-neutral-600 hover:text-neutral-900 hover:underline disabled:opacity-50"
        >
          Avançar status
        </button>
      )}
      {podeCancelar && (
        <button
          disabled={pendente}
          onClick={() => startTransition(() => cancelarAction(pedidoId))}
          className="text-xs text-red-500 hover:underline disabled:opacity-50"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
