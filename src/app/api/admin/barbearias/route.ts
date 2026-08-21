import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// NOTA: em produção, `actorId` e `papel` devem vir da sessão autenticada
// (NextAuth), nunca do header. Aqui simplificado para fins de fundação.
// A checagem de que o papel é SUPER_ADMIN deve ocorrer antes de tudo.

const criarBarbeariaSchema = z.object({
  nome: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "slug deve ser kebab-case"),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  endereco: z.string().optional(),
  planoId: z.string(),
  responsavelNome: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const papel = req.headers.get("x-user-papel");
  if (papel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const busca = searchParams.get("busca") ?? undefined;

  const tenants = await prisma.tenant.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { email: { contains: busca, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { plano: true, assinaturaSaas: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const papel = req.headers.get("x-user-papel");
  const actorId = req.headers.get("x-user-id");
  if (papel !== "SUPER_ADMIN" || !actorId) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = criarBarbeariaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existente = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
  if (existente) {
    return NextResponse.json({ error: "Já existe uma barbearia com este slug" }, { status: 409 });
  }

  const plano = await prisma.planoSaas.findUnique({ where: { id: parsed.data.planoId } });
  if (!plano) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 400 });
  }

  const trialDias = 14;
  const trialFim = new Date();
  trialFim.setDate(trialFim.getDate() + trialDias);

  const tenant = await prisma.tenant.create({
    data: {
      ...parsed.data,
      status: "TRIAL",
      dataVencimento: trialFim,
      assinaturaSaas: {
        create: {
          planoId: plano.id,
          status: "TRIAL",
          valor: plano.precoMensal,
          ciclo: plano.cicloCobranca,
          trialFim,
        },
      },
    },
    include: { assinaturaSaas: true },
  });

  await registrarAuditoria({
    actorId,
    tenantId: tenant.id,
    action: "tenant.criar",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { nome: tenant.nome, planoId: plano.id },
  });

  return NextResponse.json(tenant, { status: 201 });
}
