"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoForm } from "./actions";

type Assinatura = {
  id: string;
  status: string;
  valor: unknown;
  proximaCobranca: Date | null;
};

const STATUS_OPCOES = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAYMENT_PENDING", label: "Pagamento pendente" },
  { value: "SUSPENDED", label: "Suspensa" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function EditarAssinaturaForm({
  assinatura,
  editarAssinaturaAction,
}: {
  assinatura: Assinatura;
  editarAssinaturaAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(editarAssinaturaAction, undefined);
  const foiSubmetido = useRef(false);

  useEffect(() => {
    if (pendente) {
      foiSubmetido.current = true;
    } else if (foiSubmetido.current && !estado?.erro) {
      setAberto(false);
      foiSubmetido.current = false;
    }
  }, [pendente, estado]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs text-neutral-600 hover:underline"
      >
        Editar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <form action={formAction} className="bg-white rounded-lg p-6 space-y-3 w-full max-w-sm">
        <h2 className="font-medium">Editar assinatura SaaS</h2>
        <p className="text-xs text-neutral-400">
          Edição manual — use para ajustes de suporte (não há cobrança
          automática real ainda).
        </p>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Status</label>
          <select
            name="status"
            required
            defaultValue={assinatura.status}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Valor (R$)</label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={Number(assinatura.valor)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Próxima cobrança</label>
          <input
            name="proximaCobranca"
            type="date"
            defaultValue={
              assinatura.proximaCobranca
                ? assinatura.proximaCobranca.toISOString().split("T")[0]
                : ""
            }
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pendente}
            className="flex-1 bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="px-4 py-2 text-sm text-neutral-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
