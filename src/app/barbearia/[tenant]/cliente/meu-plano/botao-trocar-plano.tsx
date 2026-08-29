"use client";

import { useState, useTransition } from "react";
import type { EstadoTroca } from "./actions";

export function BotaoTrocarPlano({
  planoId,
  nomePlano,
  precoMensal,
  ehPlanoAtual,
  trocarPlanoAction,
}: {
  planoId: string;
  nomePlano: string;
  precoMensal: number;
  ehPlanoAtual: boolean;
  trocarPlanoAction: (planoId: string) => Promise<EstadoTroca>;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  return (
    <div className={`bg-white rounded-lg border p-4 ${ehPlanoAtual ? "border-neutral-900" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{nomePlano}</p>
          <p className="text-sm text-neutral-500">R$ {precoMensal.toFixed(2)}/mês</p>
        </div>
        {ehPlanoAtual ? (
          <span className="text-xs bg-neutral-900 text-white px-2 py-1 rounded-full">
            Plano atual
          </span>
        ) : (
          <button
            disabled={pendente}
            onClick={() =>
              startTransition(async () => {
                const resultado = await trocarPlanoAction(planoId);
                setErro(resultado?.erro ?? null);
              })
            }
            className="text-xs bg-neutral-100 border rounded-md px-3 py-1.5 hover:bg-neutral-200 disabled:opacity-50"
          >
            {pendente ? "Trocando..." : "Trocar para este plano"}
          </button>
        )}
      </div>
      {erro && <p className="text-red-500 text-xs mt-2">{erro}</p>}
    </div>
  );
}
