"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";

export function PerfilForm({
  atualizarPerfilAction,
  nomeAtual,
  telefoneAtual,
  emailAtual,
}: {
  atualizarPerfilAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  nomeAtual: string;
  telefoneAtual: string | null;
  emailAtual: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(atualizarPerfilAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3 max-w-md">
      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="nome">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={nomeAtual}
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
          defaultValue={telefoneAtual ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">E-mail</label>
        <input
          disabled
          defaultValue={emailAtual ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm bg-neutral-50 text-neutral-400"
        />
        <p className="text-xs text-neutral-400 mt-1">E-mail de login não pode ser alterado aqui.</p>
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}
      {estado?.sucesso && <p className="text-green-600 text-xs">Perfil atualizado!</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
