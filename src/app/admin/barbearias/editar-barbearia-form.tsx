"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoForm } from "./actions";

type Barbearia = {
  id: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  responsavelNome: string | null;
};

export function EditarBarbeariaForm({
  barbearia,
  editarBarbeariaAction,
}: {
  barbearia: Barbearia;
  editarBarbeariaAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(editarBarbeariaAction, undefined);
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <form action={formAction} className="bg-white rounded-lg p-6 space-y-3 w-full max-w-md my-8">
        <h2 className="font-medium">Editar barbearia</h2>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Nome</label>
          <input
            name="nome"
            required
            defaultValue={barbearia.nome}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Responsável</label>
          <input
            name="responsavelNome"
            defaultValue={barbearia.responsavelNome ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Razão social</label>
            <input
              name="razaoSocial"
              defaultValue={barbearia.razaoSocial ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">CNPJ</label>
            <input
              name="cnpj"
              defaultValue={barbearia.cnpj ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Telefone</label>
            <input
              name="telefone"
              defaultValue={barbearia.telefone ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">E-mail</label>
            <input
              name="email"
              type="email"
              defaultValue={barbearia.email ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Endereço</label>
          <input
            name="endereco"
            defaultValue={barbearia.endereco ?? ""}
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
