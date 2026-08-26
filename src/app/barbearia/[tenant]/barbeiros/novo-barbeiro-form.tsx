"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

type ServicoOpcao = { id: string; nome: string };
type UnidadeOpcao = { id: string; nome: string };

export function NovoBarbeiroForm({
  criarBarbeiroAction,
  servicosDisponiveis,
  unidadesDisponiveis,
}: {
  criarBarbeiroAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  servicosDisponiveis: ServicoOpcao[];
  unidadesDisponiveis: UnidadeOpcao[];
}) {
  const [estado, formAction, pendente] = useActionState(criarBarbeiroAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo barbeiro</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Nome completo"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="email">
          E-mail (login) *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="barbeiro@email.com"
        />
        <p className="text-xs text-neutral-400 mt-1">
          Senha inicial: <code>cortano123</code> (peça para trocar no primeiro acesso)
        </p>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="comissaoPadrao">
          Comissão padrão (%)
        </label>
        <input
          id="comissaoPadrao"
          name="comissaoPadrao"
          type="number"
          min="0"
          max="100"
          defaultValue={40}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {unidadesDisponiveis.length > 0 && (
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="unidadeId">
            Unidade
          </label>
          <select
            id="unidadeId"
            name="unidadeId"
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Sem unidade específica</option>
            {unidadesDisponiveis.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {servicosDisponiveis.length > 0 && (
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Serviços que realiza
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {servicosDisponiveis.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="servicoIds" value={s.id} />
                {s.nome}
              </label>
            ))}
          </div>
        </div>
      )}

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Adicionar barbeiro"}
      </button>
    </form>
  );
}
