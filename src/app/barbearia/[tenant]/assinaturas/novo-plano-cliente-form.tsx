"use client";

import { useActionState, useState } from "react";
import type { EstadoForm } from "./actions";

type ServicoOpcao = { id: string; nome: string };

export function NovoPlanoClienteForm({
  criarPlanoClienteAction,
  servicosDisponiveis,
}: {
  criarPlanoClienteAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  servicosDisponiveis: ServicoOpcao[];
}) {
  const [estado, formAction, pendente] = useActionState(criarPlanoClienteAction, undefined);
  const [selecionados, setSelecionados] = useState<Record<string, number>>({});

  function alternar(servicoId: string) {
    setSelecionados((prev) => {
      const copia = { ...prev };
      if (servicoId in copia) {
        delete copia[servicoId];
      } else {
        copia[servicoId] = 4;
      }
      return copia;
    });
  }

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo plano de cliente</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Nome *</label>
        <input
          name="nome"
          required
          placeholder="Ex: Plano Corte + Barba"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Preço mensal (R$) *</label>
        <input
          name="precoMensal"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Descrição</label>
        <textarea name="descricao" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">
          Serviços inclusos por mês *
        </label>
        <div className="space-y-2 border rounded-md p-2 max-h-40 overflow-y-auto">
          {servicosDisponiveis.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.id in selecionados}
                  onChange={() => alternar(s.id)}
                />
                {s.nome}
              </label>
              {s.id in selecionados && (
                <div className="flex items-center gap-1">
                  <input type="hidden" name="servicoId" value={s.id} />
                  <input
                    type="number"
                    name="quantidadeMes"
                    min={1}
                    value={selecionados[s.id]}
                    onChange={(e) =>
                      setSelecionados((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                    }
                    className="w-14 rounded border px-1 py-0.5 text-xs text-right"
                  />
                  <span className="text-xs text-neutral-400">/mês</span>
                </div>
              )}
            </div>
          ))}
          {servicosDisponiveis.length === 0 && (
            <p className="text-xs text-neutral-400">Cadastre serviços primeiro.</p>
          )}
        </div>
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Criar plano"}
      </button>
    </form>
  );
}
