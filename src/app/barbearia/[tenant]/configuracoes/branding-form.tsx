"use client";

import { useActionState } from "react";
import type { EstadoForm } from "./actions";
import { UploadImagem } from "@/components/upload-imagem";

export function BrandingForm({
  atualizarBrandingAction,
  corAtual,
  logoAtual,
}: {
  atualizarBrandingAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  corAtual: string;
  logoAtual: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(atualizarBrandingAction, undefined);

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-3 max-w-md">
      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="corPrimaria">
          Cor de marca
        </label>
        <div className="flex items-center gap-2">
          <input
            id="corPrimaria"
            name="corPrimaria"
            type="color"
            defaultValue={corAtual}
            className="h-9 w-14 rounded border"
          />
          <span className="text-xs text-neutral-400">
            Usada em botões e destaques na área do cliente
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="logoUrl">
          URL do logo (opcional, se não fizer upload)
        </label>
        <input
          id="logoUrl"
          name="logoUrlTexto"
          type="url"
          defaultValue={logoAtual ?? ""}
          placeholder="https://..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <UploadImagem name="logoUrl" label="Ou envie um arquivo de logo" valorAtual={logoAtual} />

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="bg-neutral-900 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Salvar personalização"}
      </button>
    </form>
  );
}
