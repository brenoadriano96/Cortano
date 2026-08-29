"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoForm } from "./actions";
import { UploadImagem } from "@/components/upload-imagem";

type Servico = {
  id: string;
  nome: string;
  preco: unknown; // Decimal do Prisma, convertido com Number() na exibição
  duracaoMin: number;
  descricao: string | null;
  fotoUrl: string | null;
};

export function EditarServicoForm({
  servico,
  atualizarServicoAction,
}: {
  servico: Servico;
  atualizarServicoAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(atualizarServicoAction, undefined);
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
        <h2 className="font-medium">Editar serviço</h2>

        <UploadImagem name="fotoUrl" label="Foto do serviço" valorAtual={servico.fotoUrl} />

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Nome</label>
          <input
            name="nome"
            required
            defaultValue={servico.nome}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Preço (R$)</label>
            <input
              name="preco"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={Number(servico.preco)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Duração (min)</label>
            <input
              name="duracaoMin"
              type="number"
              min="1"
              required
              defaultValue={servico.duracaoMin}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Descrição</label>
          <textarea
            name="descricao"
            rows={2}
            defaultValue={servico.descricao ?? ""}
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
