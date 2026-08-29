"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoForm } from "./actions";

type Plano = {
  id: string;
  nome: string;
  precoMensal: unknown;
  maxBarbeiros: number | null;
  maxUsuarios: number | null;
  maxClientes: number | null;
  maxProdutos: number | null;
};

export function EditarPlanoForm({
  plano,
  qtdBarbeariasUsando,
  editarPlanoAction,
}: {
  plano: Plano;
  qtdBarbeariasUsando: number;
  editarPlanoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(editarPlanoAction, undefined);
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
        <h2 className="font-medium">Editar plano</h2>

        {qtdBarbeariasUsando > 0 && (
          <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded p-2">
            {qtdBarbeariasUsando} barbearia(s) usam este plano — mudar
            preço/limites afeta todas elas imediatamente.
          </p>
        )}

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Nome</label>
          <input
            name="nome"
            required
            defaultValue={plano.nome}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Preço mensal (R$)</label>
          <input
            name="precoMensal"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={Number(plano.precoMensal)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Máx. barbeiros</label>
            <input
              name="maxBarbeiros"
              type="number"
              min="1"
              defaultValue={plano.maxBarbeiros ?? ""}
              placeholder="Ilimitado"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Máx. usuários</label>
            <input
              name="maxUsuarios"
              type="number"
              min="1"
              defaultValue={plano.maxUsuarios ?? ""}
              placeholder="Ilimitado"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Máx. clientes</label>
            <input
              name="maxClientes"
              type="number"
              min="1"
              defaultValue={plano.maxClientes ?? ""}
              placeholder="Ilimitado"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Máx. produtos</label>
            <input
              name="maxProdutos"
              type="number"
              min="1"
              defaultValue={plano.maxProdutos ?? ""}
              placeholder="Ilimitado"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
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
