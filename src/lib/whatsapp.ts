/**
 * Integração com WhatsApp via Meta Cloud API (WhatsApp Business Platform).
 *
 * Setup necessário (seção 9 do roadmap — "Integração WhatsApp"):
 * 1. Criar app em https://developers.facebook.com com produto WhatsApp
 * 2. Obter WHATSAPP_TOKEN (token de acesso) e WHATSAPP_PHONE_ID (ID do
 *    número de telefone comercial)
 * 3. Configurar as duas variáveis no Netlify
 *
 * Sem essas variáveis configuradas, as funções abaixo não lançam erro —
 * apenas retornam sem enviar (log silencioso) para não quebrar o fluxo
 * principal (confirmar agendamento não deve falhar por causa do WhatsApp).
 */

function whatsappConfigurado() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

/**
 * Envia uma mensagem de texto simples via WhatsApp. Números devem estar no
 * formato internacional sem símbolos, ex: 5582999990000.
 */
export async function enviarWhatsApp(numero: string, mensagem: string): Promise<void> {
  if (!whatsappConfigurado()) {
    console.log(`[WhatsApp não configurado] Para ${numero}: ${mensagem}`);
    return;
  }

  const numeroLimpo = numero.replace(/\D/g, "");
  if (!numeroLimpo) return;

  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numeroLimpo,
          type: "text",
          text: { body: mensagem },
        }),
      }
    );
  } catch (error) {
    // Falha no envio de notificação nunca deve quebrar o fluxo principal
    // (ex: criar agendamento tem que funcionar mesmo se o WhatsApp cair)
    console.error("Falha ao enviar WhatsApp:", error);
  }
}

// ---------------------------------------------------------------------------
// Templates de notificação — seção 9 do documento de arquitetura Cortano
// ---------------------------------------------------------------------------

export function mensagemAgendamentoConfirmado(params: {
  clienteNome: string;
  barbeariaNome: string;
  dataHora: Date;
  servicos: string;
}) {
  const dataFormatada = params.dataHora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const horaFormatada = params.dataHora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Olá, ${params.clienteNome}! Seu agendamento na ${params.barbeariaNome} foi confirmado para ${dataFormatada} às ${horaFormatada} (${params.servicos}). Até lá! ✂️`;
}

export function mensagemLembrete1Hora(params: {
  clienteNome: string;
  barbeariaNome: string;
  horaFormatada: string;
}) {
  return `Olá, ${params.clienteNome}! Seu horário na ${params.barbeariaNome} começa em 1 hora, às ${params.horaFormatada}. Te esperamos! ✂️`;
}

export function mensagemPagamentoAprovado(params: {
  clienteNome: string;
  barbeariaNome: string;
  valor: number;
}) {
  return `${params.clienteNome}, recebemos seu pagamento de R$ ${params.valor.toFixed(
    2
  )} na ${params.barbeariaNome}. Obrigado! ✅`;
}

export function mensagemNovoAgendamentoParaBarbearia(params: {
  clienteNome: string;
  dataHora: Date;
  barbeiroNome: string;
}) {
  const dataFormatada = params.dataHora.toLocaleDateString("pt-BR");
  const horaFormatada = params.dataHora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Novo agendamento: ${params.clienteNome} com ${params.barbeiroNome} em ${dataFormatada} às ${horaFormatada}.`;
}

export function mensagemEstoqueBaixo(params: { produtoNome: string; estoqueAtual: number }) {
  return `⚠️ Estoque baixo: "${params.produtoNome}" com apenas ${params.estoqueAtual} unidade(s) restante(s).`;
}
