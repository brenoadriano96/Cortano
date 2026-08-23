"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

type Opcao = { id: string; nome: string };
type ServicoOpcao = Opcao & { duracaoMin: number; preco: number };

export function NovoAgendamentoForm({
  criarAgendamentoAction,
  clientes,
  barbeiros,
  servicos,
  dataSelecionada,
}: {
  criarAgendamentoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  clientes: Opcao[];
  barbeiros: Opcao[];
  servicos: ServicoOpcao[];
  dataSelecionada: string;
}) {
  const [estado, formAction, pendente] = useActionState(criarAgendamentoAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Novo agendamento</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="clienteId">
          Cliente *
        </label>
        <select
          id="clienteId"
          name="clienteId"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="barbeiroId">
          Barbeiro *
        </label>
        <select
          id="barbeiroId"
          name="barbeiroId"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Serviços *</label>
        <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
          {servicos.map((s) => (
            <label key={s.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <input type="checkbox" name="servicoIds" value={s.id} />
                {s.nome}
              </span>
              <span className="text-neutral-400 text-xs">
                {s.duracaoMin}min · R$ {s.preco.toFixed(2)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="data">
            Data *
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={dataSelecionada}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="hora">
            Horário *
          </label>
          <input
            id="hora"
            name="hora"
            type="time"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Agendando..." : "Criar agendamento"}
      </button>
    </form>
  );
}
