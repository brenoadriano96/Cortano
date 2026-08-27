"use client";

import { useState } from "react";

/**
 * Upload de imagem simplificado para o MVP: converte o arquivo para uma
 * data URL (base64) no próprio navegador e envia como valor de um campo
 * hidden — sem depender de um provedor de storage externo (S3, Cloudinary
 * etc.), que ainda não está configurado nesta plataforma.
 *
 * Limitação conhecida: base64 infla o tamanho do dado (~33%) e fica salvo
 * direto na coluna do banco (String) em vez de um storage dedicado. Para
 * uma base de fotos maior, migrar para um bucket de objetos é o próximo
 * passo natural — os campos já se chamam `fotoUrl`/`logoUrl` para essa
 * migração ser transparente (troca a string por uma URL real depois).
 */
export function UploadImagem({
  name,
  label,
  valorAtual,
}: {
  name: string;
  label: string;
  valorAtual?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(valorAtual ?? null);
  const [erro, setErro] = useState<string | null>(null);

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("Imagem muito grande (máx. 2MB).");
      return;
    }
    setErro(null);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(arquivo);
  }

  return (
    <div>
      <label className="block text-xs text-neutral-500 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-12 w-12 rounded object-cover border" />
        ) : (
          <div className="h-12 w-12 rounded border bg-neutral-50" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={aoSelecionar}
          className="text-xs"
        />
      </div>
      <input type="hidden" name={name} value={preview ?? ""} />
      {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
    </div>
  );
}
