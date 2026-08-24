"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

type PlanoOpcao = { id: string; nome: string; precoMensal: number };

export function NovaBarbeariaForm({
  criarBarbeariaAction,
  planos,
}: {
  criarBarbeariaAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  planos: PlanoOpcao[];
}) {
  const [estado, formAction, pendente] = useActionState(criarBarbeariaAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Nova barbearia</h2>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Barbearia do João"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="slug">
          Slug (URL) *
        </label>
        <input
          id="slug"
          name="slug"
          required
          pattern="[a-z0-9-]+"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="barbearia-do-joao"
        />
        <p className="text-xs text-neutral-400 mt-1">
          Acessível em /barbearia/[slug] — só letras minúsculas, números e hífen
        </p>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="responsavelNome">
          Responsável
        </label>
        <input
          id="responsavelNome"
          name="responsavelNome"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1" htmlFor="telefone">
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="planoId">
          Plano *
        </label>
        <select
          id="planoId"
          name="planoId"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} — R$ {p.precoMensal.toFixed(2)}/mês
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-neutral-400">
        A barbearia começa em período de trial de 14 dias.
      </p>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Criar barbearia"}
      </button>
    </form>
  );
}
