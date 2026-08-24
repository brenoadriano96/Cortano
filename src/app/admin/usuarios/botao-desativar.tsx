"use client";

import { useTransition } from "react";

export function BotaoDesativarAdmin({
  usuarioId,
  desativarAction,
}: {
  usuarioId: string;
  desativarAction: (usuarioId: string) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  return (
    <button
      disabled={pendente}
      onClick={() => {
        if (confirm("Desativar o acesso deste administrador?")) {
          startTransition(() => desativarAction(usuarioId));
        }
      }}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      Desativar
    </button>
  );
}
