"use client";

import { useState } from "react";

export function BotaoAssinar({
  planoClienteId,
  tenantSlug,
  nomePlano,
  precoMensal,
}: {
  planoClienteId: string;
  tenantSlug: string;
  nomePlano: string;
  precoMensal: number;
}) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function assinar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/checkout/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoClienteId, tenantSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível iniciar o pagamento.");
        setCarregando(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="font-medium">{nomePlano}</p>
      <p className="text-sm text-neutral-500 mb-3">
        R$ {precoMensal.toFixed(2)}/mês
      </p>
      {erro && <p className="text-red-500 text-xs mb-2">{erro}</p>}
      <button
        onClick={assinar}
        disabled={carregando}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {carregando ? "Redirecionando..." : "Assinar"}
      </button>
    </div>
  );
}
