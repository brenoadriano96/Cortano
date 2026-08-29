"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoForm } from "./actions";
import { UploadImagem } from "@/components/upload-imagem";

type Barbeiro = {
  id: string;
  nome: string;
  unidadeId: string | null;
  comissaoPadrao: unknown;
  fotoUrl: string | null;
};
type UnidadeOpcao = { id: string; nome: string };

export function EditarBarbeiroForm({
  barbeiro,
  unidadesDisponiveis,
  atualizarBarbeiroAction,
}: {
  barbeiro: Barbeiro;
  unidadesDisponiveis: UnidadeOpcao[];
  atualizarBarbeiroAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(atualizarBarbeiroAction, undefined);
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
      <button type="button" onClick={() => setAberto(true)} className="text-xs text-neutral-600 hover:underline">
        Editar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <form action={formAction} className="bg-white rounded-lg p-6 space-y-3 w-full max-w-sm">
        <h2 className="font-medium">Editar barbeiro</h2>

        <UploadImagem name="fotoUrl" label="Foto do barbeiro" valorAtual={barbeiro.fotoUrl} />

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Nome</label>
          <input
            name="nome"
            required
            defaultValue={barbeiro.nome}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {unidadesDisponiveis.length > 0 && (
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Unidade</label>
            <select
              name="unidadeId"
              defaultValue={barbeiro.unidadeId ?? ""}
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

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Comissão padrão (%)</label>
          <input
            name="comissaoPadrao"
            type="number"
            min="0"
            max="100"
            defaultValue={Number(barbeiro.comissaoPadrao)}
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
