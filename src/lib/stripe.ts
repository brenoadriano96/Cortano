import Stripe from "stripe";

/**
 * Cliente Stripe singleton. Cobre a assinatura CLIENTE -> BARBEARIA
 * (planos de corte recorrentes). A assinatura BARBEARIA -> CORTANO (SaaS)
 * usa a mesma infraestrutura, mas com produtos/preços diferentes — ver
 * seção 22 do documento de arquitetura (separação financeira).
 *
 * Se STRIPE_SECRET_KEY não estiver configurada, o cliente ainda é criado
 * (não lança erro no import) para não quebrar o build — as rotas que o
 * usam devem checar e retornar erro amigável em runtime.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  // Cast para evitar que uma string de versão desatualizada quebre o build —
  // o pacote instalado no Netlify pode ter uma versão mais nova que a usada
  // aqui em desenvolvimento. Ajuste para a versão mostrada em
  // https://docs.stripe.com/api/versioning quando for para produção de fato.
  apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion,
  typescript: true,
});

export function stripeConfigurado() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
