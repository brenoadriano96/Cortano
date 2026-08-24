import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigurado } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/** Extrai o ID da assinatura de uma invoice de forma tolerante a mudanças
 * na forma exata do objeto (a Stripe já reestruturou este campo entre
 * versões da API — "subscription" direto vs. dentro de "parent"). */
function extrairSubscriptionId(invoice: Stripe.Invoice): string | null {
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const direto = invoiceAny.subscription;
  if (typeof direto === "string") return direto;

  const parent = invoiceAny.parent as Record<string, unknown> | undefined;
  const subscriptionDetails = parent?.subscription_details as
    | Record<string, unknown>
    | undefined;
  const viaParent = subscriptionDetails?.subscription;
  if (typeof viaParent === "string") return viaParent;

  return null;
}

/**
 * Webhook central do Stripe. Eventos tratados:
 * - checkout.session.completed: ativa a AssinaturaCliente (primeira cobrança
 *   confirmada) e guarda os IDs do Stripe para cobranças futuras.
 * - invoice.paid: registra uma Cobranca como PAGA e atualiza próxima data.
 * - invoice.payment_failed: marca a assinatura como INADIMPLENTE (seção 11
 *   se aplica de forma equivalente à assinatura do cliente).
 * - customer.subscription.deleted: marca a assinatura como CANCELADA.
 *
 * IMPORTANTE: configure STRIPE_WEBHOOK_SECRET com o valor que o Stripe
 * mostra ao criar o endpoint de webhook (Dashboard -> Developers -> Webhooks).
 * Sem isso, a assinatura da requisição não pode ser verificada e o evento
 * é rejeitado — isso é proposital, nunca processar webhook sem verificar
 * a assinatura (qualquer um poderia forjar "pagamento aprovado" senão).
 */
export async function POST(req: NextRequest) {
  if (!stripeConfigurado() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
  }

  const body = await req.text();
  const assinaturaHeader = req.headers.get("stripe-signature");
  if (!assinaturaHeader) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      assinaturaHeader,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const { tenantId, clienteId, planoClienteId } = checkoutSession.metadata ?? {};
      if (!tenantId || !clienteId || !planoClienteId) break;

      const proximaCobranca = new Date();
      proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);

      const customerId =
        typeof checkoutSession.customer === "string" ? checkoutSession.customer : null;
      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : null;

      await prisma.assinaturaCliente.upsert({
        where: { clienteId },
        update: {
          status: "ATIVA",
          gatewayCustomerId: customerId,
          gatewaySubscriptionId: subscriptionId,
          proximaCobranca,
          ultimaCobranca: new Date(),
        },
        create: {
          tenantId,
          clienteId,
          planoId: planoClienteId,
          status: "ATIVA",
          gatewayCustomerId: customerId,
          gatewaySubscriptionId: subscriptionId,
          proximaCobranca,
          ultimaCobranca: new Date(),
        },
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = extrairSubscriptionId(invoice);
      if (!subscriptionId) break;

      const assinatura = await prisma.assinaturaCliente.findFirst({
        where: { gatewaySubscriptionId: subscriptionId },
      });
      if (!assinatura) break;

      const proximaCobranca = new Date();
      proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);

      await prisma.assinaturaCliente.update({
        where: { id: assinatura.id },
        data: { status: "ATIVA", ultimaCobranca: new Date(), proximaCobranca },
      });

      await prisma.cobranca.create({
        data: {
          assinaturaId: assinatura.id,
          valor: (invoice.amount_paid ?? 0) / 100,
          status: "PAGA",
          dataVencimento: new Date(),
          dataPagamento: new Date(),
          gatewayChargeId: invoice.id,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = extrairSubscriptionId(invoice);
      if (!subscriptionId) break;

      await prisma.assinaturaCliente.updateMany({
        where: { gatewaySubscriptionId: subscriptionId },
        data: { status: "INADIMPLENTE" },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.assinaturaCliente.updateMany({
        where: { gatewaySubscriptionId: subscription.id },
        data: { status: "CANCELADA" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
