"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validarDisponibilidade } from "@/lib/disponibilidade";
import {
  enviarWhatsApp,
  mensagemAgendamentoConfirmado,
  mensagemNovoAgendamentoParaBarbearia,
} from "@/lib/whatsapp";

export type EstadoForm = { erro?: string; sucesso?: boolean } | undefined;

const agendarSchema = z.object({
  barbeiroId: z.string().min(1, "Selecione um barbeiro"),
  servicoIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  data: z.string().min(1, "Informe a data"),
  hora: z.string().min(1, "Informe o horário"),
});

/**
 * O cliente só pode agendar para si mesmo — clienteId nunca vem do form,
 * vem resolvido a partir da sessão (ver getClienteAtual), impedindo que um
 * cliente marque horário em nome de outro.
 */
export async function clienteAgendar(
  tenantId: string,
  slug: string,
  clienteId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = agendarSchema.safeParse({
    barbeiroId: formData.get("barbeiroId"),
    servicoIds: formData.getAll("servicoIds"),
    data: formData.get("data"),
    hora: formData.get("hora"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { barbeiroId, servicoIds, data, hora } = parsed.data;

  const servicos = await prisma.servico.findMany({
    where: { id: { in: servicoIds }, tenantId },
  });
  if (servicos.length !== servicoIds.length) {
    return { erro: "Um ou mais serviços inválidos." };
  }

  const duracaoTotalMin = servicos.reduce((acc, s) => acc + s.duracaoMin, 0);
  const valorTotal = servicos.reduce((acc, s) => acc + Number(s.preco), 0);
  const inicio = new Date(`${data}T${hora}:00`);

  if (inicio.getTime() < Date.now()) {
    return { erro: "Não é possível agendar em um horário passado." };
  }

  const fim = new Date(inicio.getTime() + duracaoTotalMin * 60_000);

  // Seção 14: valida expediente, bloqueios de agenda e conflitos
  const erroDisponibilidade = await validarDisponibilidade(tenantId, barbeiroId, inicio, fim);
  if (erroDisponibilidade) {
    return { erro: erroDisponibilidade };
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      tenantId,
      clienteId,
      barbeiroId,
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      valorTotal,
      origem: "APP_CLIENTE",
      servicos: {
        create: servicos.map((s) => ({ servicoId: s.id, precoCobrado: s.preco })),
      },
    },
    include: { cliente: true, barbeiro: true, tenant: true },
  });

  // Notificações via WhatsApp (seção 9) — falha aqui nunca bloqueia o
  // agendamento em si, enviarWhatsApp já trata erros internamente.
  if (agendamento.cliente.telefone) {
    await enviarWhatsApp(
      agendamento.cliente.telefone,
      mensagemAgendamentoConfirmado({
        clienteNome: agendamento.cliente.nome,
        barbeariaNome: agendamento.tenant.nome,
        dataHora: inicio,
        servicos: servicos.map((s) => s.nome).join(", "),
      })
    );
  }
  if (agendamento.tenant.telefone) {
    await enviarWhatsApp(
      agendamento.tenant.telefone,
      mensagemNovoAgendamentoParaBarbearia({
        clienteNome: agendamento.cliente.nome,
        dataHora: inicio,
        barbeiroNome: agendamento.barbeiro.nome,
      })
    );
  }

  revalidatePath(`/barbearia/${slug}/cliente/agendamentos`);
  return { sucesso: true };
}
