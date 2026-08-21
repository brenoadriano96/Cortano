export default async function RegularizacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;

  const mensagens: Record<string, string> = {
    suspended:
      "Sua conta está suspensa por pendência de pagamento ou ação administrativa.",
    cancelled: "Sua conta foi cancelada.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md text-center bg-white border rounded-lg p-8">
        <h1 className="text-xl font-semibold mb-2">Acesso indisponível</h1>
        <p className="text-neutral-600 mb-6">
          {mensagens[motivo ?? ""] ?? "Entre em contato com o suporte para regularizar sua conta."}
        </p>
        {/* TODO (Etapa 2/Fase 2): botão de regularização de pagamento
            integrado ao gateway (Stripe/Pagar.me/Asaas) */}
        <button className="bg-neutral-900 text-white px-4 py-2 rounded-md text-sm">
          Regularizar pagamento
        </button>
      </div>
    </div>
  );
}
