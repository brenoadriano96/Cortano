"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Cancelamento restrito ao próprio cliente e ao próprio agendamento —
 * o filtro por clienteId garante que ninguém cancele agendamento de outro.
 */
export async function cancelarAgendamentoCliente(
  tenantId: string,
  slug: string,
  clienteId: string,
  agendamentoId: string
) {
  await prisma.agendamento.updateMany({
    where: {
      id: agendamentoId,
      tenantId,
      clienteId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
    },
    data: { status: "CANCELADO" },
  });
  revalidatePath(`/barbearia/${slug}/cliente/agendamentos`);
}
