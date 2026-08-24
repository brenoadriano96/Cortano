import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigurado } from "@/lib/stripe";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  planoClienteId: z.string(),
  tenantSlug: z.string(),
});

/**
 * Cria uma sessão de Stripe Checkout para o cliente assinar um plano da
 * barbearia (Cliente -> Barbearia — seção 16/22, financeiramente separado
 * da assinatura Barbearia -> Cortano).
 *
 * O modo é "subscription": o Stripe cobra recorrentemente sozinho a partir
 * daqui; a confirmação do pagamento chega via webhook
 * (/api/webhooks/stripe), que é quem efetivamente ativa a AssinaturaCliente.
 */
export async function POST(req: NextRequest) {
  if (!stripeConfigurado()) {
    return NextResponse.json(
      { error: "Pagamentos ainda não configurados (STRIPE_SECRET_KEY ausente)." },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user || session.user.papel !== "CLIENTE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  }

  const cliente = await prisma.cliente.findFirst({
    where: { tenantId: session.user.tenantId!, usuarioId: session.user.id },
  });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const plano = await prisma.planoCliente.findFirst({
    where: { id: parsed.data.planoClienteId, tenantId: session.user.tenantId!, ativo: true },
  });
  if (!plano) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  const origem = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: cliente.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: Math.round(Number(plano.precoMensal) * 100),
          recurring: { interval: "month" },
          product_data: { name: plano.nome },
        },
        quantity: 1,
      },
    ],
    metadata: {
      tenantId: session.user.tenantId!,
      clienteId: cliente.id,
      planoClienteId: plano.id,
    },
    success_url: `${origem}/barbearia/${parsed.data.tenantSlug}/cliente/meu-plano?checkout=sucesso`,
    cancel_url: `${origem}/barbearia/${parsed.data.tenantSlug}/cliente/meu-plano?checkout=cancelado`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
