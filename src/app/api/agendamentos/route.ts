import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// NOTA: em produção, tenantId deve vir da sessão autenticada (NextAuth),
// nunca confiar apenas no header/body enviado pelo client.
// Este exemplo lê de um header injetado pelo middleware para simplificar.

const criarAgendamentoSchema = z.object({
  clienteId: z.string(),
  barbeiroId: z.string(),
  servicoIds: z.array(z.string()).min(1),
  dataHoraInicio: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const barbeiroId = searchParams.get("barbeiroId") ?? undefined;
  const data = searchParams.get("data") ?? undefined; // YYYY-MM-DD

  const where: Record<string, unknown> = { tenantId };
  if (barbeiroId) where.barbeiroId = barbeiroId;
  if (data) {
    const inicio = new Date(`${data}T00:00:00`);
    const fim = new Date(`${data}T23:59:59`);
    where.dataHoraInicio = { gte: inicio, lte: fim };
  }

  const agendamentos = await prisma.agendamento.findMany({
    where,
    include: { cliente: true, barbeiro: true, servicos: { include: { servico: true } } },
    orderBy: { dataHoraInicio: "asc" },
  });

  return NextResponse.json(agendamentos);
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = criarAgendamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { clienteId, barbeiroId, servicoIds, dataHoraInicio } = parsed.data;

  const servicos = await prisma.servico.findMany({
    where: { id: { in: servicoIds }, tenantId },
  });
  if (servicos.length !== servicoIds.length) {
    return NextResponse.json(
      { error: "Um ou mais serviços não pertencem a esta barbearia" },
      { status: 400 }
    );
  }

  const duracaoTotalMin = servicos.reduce((acc, s) => acc + s.duracaoMin, 0);
  const valorTotal = servicos.reduce((acc, s) => acc + Number(s.preco), 0);
  const inicio = new Date(dataHoraInicio);
  const fim = new Date(inicio.getTime() + duracaoTotalMin * 60_000);

  // Checagem simples de conflito de horário para o barbeiro
  const conflito = await prisma.agendamento.findFirst({
    where: {
      tenantId,
      barbeiroId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
      AND: [
        { dataHoraInicio: { lt: fim } },
        { dataHoraFim: { gt: inicio } },
      ],
    },
  });
  if (conflito) {
    return NextResponse.json(
      { error: "Barbeiro já possui agendamento nesse horário" },
      { status: 409 }
    );
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      tenantId,
      clienteId,
      barbeiroId,
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      valorTotal,
      servicos: {
        create: servicos.map((s) => ({ servicoId: s.id, precoCobrado: s.preco })),
      },
    },
    include: { servicos: true },
  });

  return NextResponse.json(agendamento, { status: 201 });
}
