"use client";

import { useTransition } from "react";

export function BotaoConverterIndicacao({
  indicacaoId,
  converterAction,
}: {
  indicacaoId: string;
  converterAction: (indicacaoId: string) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  return (
    <button
      disabled={pendente}
      onClick={() => startTransition(() => converterAction(indicacaoId))}
      className="text-xs text-green-600 hover:underline disabled:opacity-50"
    >
      {pendente ? "Convertendo..." : "Marcar como convertido"}
    </button>
  );
}
