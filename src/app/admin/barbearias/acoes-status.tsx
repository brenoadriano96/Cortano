"use client";

import { useTransition } from "react";

export function AcoesStatusBarbearia({
  tenantId,
  status,
  alterarStatusAction,
}: {
  tenantId: string;
  status: string;
  alterarStatusAction: (
    tenantId: string,
    acao: "suspender" | "reativar" | "cancelar"
  ) => Promise<void>;
}) {
  const [pendente, startTransition] = useTransition();

  function executar(acao: "suspender" | "reativar" | "cancelar") {
    if (acao === "cancelar" && !confirm("Cancelar esta barbearia? Esta ação é definitiva.")) {
      return;
    }
    startTransition(() => alterarStatusAction(tenantId, acao));
  }

  return (
    <div className="flex gap-2 justify-end">
      {status !== "SUSPENDED" && status !== "CANCELLED" && (
        <button
          disabled={pendente}
          onClick={() => executar("suspender")}
          className="text-xs text-amber-600 hover:underline disabled:opacity-50"
        >
          Suspender
        </button>
      )}
      {status === "SUSPENDED" && (
        <button
          disabled={pendente}
          onClick={() => executar("reativar")}
          className="text-xs text-green-600 hover:underline disabled:opacity-50"
        >
          Reativar
        </button>
      )}
      {status !== "CANCELLED" && (
        <button
          disabled={pendente}
          onClick={() => executar("cancelar")}
          className="text-xs text-red-500 hover:underline disabled:opacity-50"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
