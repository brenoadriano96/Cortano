import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const SENHA_PADRAO_SEED = "cortano123";

/**
 * Rota TEMPORÁRIA para popular o banco com dados de teste sem precisar de
 * terminal (útil enquanto o setup é feito só pelo celular/painel web).
 *
 * Uso: acesse no navegador
 *   https://SEU-SITE.netlify.app/api/dev/seed?key=SUA_SENHA
 *
 * Protegida pela variável de ambiente SEED_SECRET — configure-a no Netlify
 * antes de usar. Sem essa variável configurada, a rota recusa qualquer chamada.
 *
 * IMPORTANTE: remover este arquivo (ou a variável SEED_SECRET) depois que o
 * banco estiver populado, para não deixar uma rota de escrita aberta em produção.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.SEED_SECRET;
  const key = req.nextUrl.searchParams.get("key");

  if (!secret) {
    return NextResponse.json(
      { error: "SEED_SECRET não configurada no ambiente. Configure antes de usar esta rota." },
      { status: 500 }
    );
  }

  if (key !== secret) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 401 });
  }

  const logs: string[] = [];

  try {
    const senhaHash = await bcrypt.hash(SENHA_PADRAO_SEED, 10);

    // 1. Plano SaaS
    const planoPro = await prisma.planoSaas.upsert({
      where: { id: "plano-saas-pro-seed" },
      update: {},
      create: {
        id: "plano-saas-pro-seed",
        nome: "Pro",
        precoMensal: 149.9,
        cicloCobranca: "MENSAL",
        maxBarbeiros: 5,
        maxUsuarios: 10,
        maxClientes: 1000,
        maxProdutos: 200,
        recursos: { loja: true, whatsapp: false, relatorios_avancados: true },
      },
    });
    logs.push(`Plano SaaS: ${planoPro.nome}`);

    // 2. Tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: "barbearia-modelo" },
      update: {},
      create: {
        slug: "barbearia-modelo",
        nome: "Barbearia Modelo",
        razaoSocial: "Barbearia Modelo LTDA",
        cnpj: "00.000.000/0001-00",
        telefone: "(82) 90000-0000",
        email: "contato@barbeariamodelo.com",
        endereco: "Rua Exemplo, 123 - Maceió/AL",
        responsavelNome: "João Proprietário",
        planoId: planoPro.id,
        status: "ACTIVE",
      },
    });
    logs.push(`Tenant: ${tenant.nome} (slug: ${tenant.slug})`);

    await prisma.assinaturaSaas.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        planoId: planoPro.id,
        status: "ACTIVE",
        valor: planoPro.precoMensal,
        ciclo: "MENSAL",
        proximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 3. Usuários
    const superAdminExistente = await prisma.usuario.findFirst({
      where: { email: "admin@cortano.com", papel: PapelUsuario.SUPER_ADMIN },
    });
    if (!superAdminExistente) {
      await prisma.usuario.create({
        data: {
          tenantId: null,
          nome: "Admin Cortano",
          email: "admin@cortano.com",
          senhaHash,
          papel: PapelUsuario.SUPER_ADMIN,
        },
      });
    } else if (!superAdminExistente.senhaHash) {
      await prisma.usuario.update({
        where: { id: superAdminExistente.id },
        data: { senhaHash },
      });
    }
    logs.push(`Super Admin: admin@cortano.com (senha: ${SENHA_PADRAO_SEED})`);

    await prisma.usuario.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: "proprietario@barbeariamodelo.com" } },
      update: { senhaHash },
      create: {
        tenantId: tenant.id,
        nome: "João Proprietário",
        email: "proprietario@barbeariamodelo.com",
        senhaHash,
        papel: PapelUsuario.PROPRIETARIO,
      },
    });

    const usuarioBarbeiro1 = await prisma.usuario.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: "carlos@barbeariamodelo.com" } },
      update: { senhaHash },
      create: {
        tenantId: tenant.id,
        nome: "Carlos Barbeiro",
        email: "carlos@barbeariamodelo.com",
        senhaHash,
        papel: PapelUsuario.BARBEIRO,
      },
    });

    const usuarioBarbeiro2 = await prisma.usuario.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: "pedro@barbeariamodelo.com" } },
      update: { senhaHash },
      create: {
        tenantId: tenant.id,
        nome: "Pedro Barbeiro",
        email: "pedro@barbeariamodelo.com",
        senhaHash,
        papel: PapelUsuario.BARBEIRO,
      },
    });

    await prisma.usuario.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: "atendente@barbeariamodelo.com" } },
      update: { senhaHash },
      create: {
        tenantId: tenant.id,
        nome: "Ana Atendente",
        email: "atendente@barbeariamodelo.com",
        senhaHash,
        papel: PapelUsuario.ATENDENTE,
      },
    });
    logs.push(`Equipe da barbearia criada — todos com senha: ${SENHA_PADRAO_SEED}`);

    // 4. Barbeiros
    const barbeiro1 = await prisma.barbeiro.upsert({
      where: { usuarioId: usuarioBarbeiro1.id },
      update: {},
      create: {
        tenantId: tenant.id,
        usuarioId: usuarioBarbeiro1.id,
        nome: "Carlos Barbeiro",
        especialidades: ["Corte", "Barba"],
        comissaoPadrao: 40,
        horarios: {
          create: [1, 2, 3, 4, 5].map((dia) => ({
            diaSemana: dia,
            horaInicio: "09:00",
            horaFim: "18:00",
          })),
        },
      },
    });

    const barbeiro2 = await prisma.barbeiro.upsert({
      where: { usuarioId: usuarioBarbeiro2.id },
      update: {},
      create: {
        tenantId: tenant.id,
        usuarioId: usuarioBarbeiro2.id,
        nome: "Pedro Barbeiro",
        especialidades: ["Corte", "Pigmentação", "Sobrancelha"],
        comissaoPadrao: 35,
        horarios: {
          create: [2, 3, 4, 5, 6].map((dia) => ({
            diaSemana: dia,
            horaInicio: "10:00",
            horaFim: "19:00",
          })),
        },
      },
    });
    logs.push(`Barbeiros: ${barbeiro1.nome} e ${barbeiro2.nome}`);

    // 5. Serviços
    const servicosData = [
      { nome: "Corte", preco: 45, duracaoMin: 30 },
      { nome: "Barba", preco: 30, duracaoMin: 20 },
      { nome: "Corte + Barba", preco: 65, duracaoMin: 50 },
      { nome: "Sobrancelha", preco: 20, duracaoMin: 15 },
    ];

    const servicos = [];
    for (const s of servicosData) {
      const id = `servico-seed-${s.nome.toLowerCase().replace(/[\s+]/g, "-")}`;
      const servico = await prisma.servico.upsert({
        where: { id },
        update: {},
        create: {
          id,
          tenantId: tenant.id,
          nome: s.nome,
          preco: s.preco,
          duracaoMin: s.duracaoMin,
          barbeiros: {
            create: [{ barbeiroId: barbeiro1.id }, { barbeiroId: barbeiro2.id }],
          },
        },
      });
      servicos.push(servico);
    }
    logs.push(`${servicos.length} serviços criados`);

    // 6. Clientes
    const clientesData = [
      { nome: "Marcos Silva", telefone: "(82) 99999-0001", email: "marcos@exemplo.com" },
      { nome: "Rafael Souza", telefone: "(82) 99999-0002", email: "rafael@exemplo.com" },
      { nome: "Bruno Costa", telefone: "(82) 99999-0003", email: "bruno@exemplo.com" },
      { nome: "Felipe Lima", telefone: "(82) 99999-0004", email: "felipe@exemplo.com" },
      { nome: "Gustavo Alves", telefone: "(82) 99999-0005", email: "gustavo@exemplo.com" },
    ];

    const clientes = [];
    for (const c of clientesData) {
      const id = `cliente-seed-${c.email.split("@")[0]}`;
      const cliente = await prisma.cliente.upsert({
        where: { id },
        update: {},
        create: { id, tenantId: tenant.id, nome: c.nome, telefone: c.telefone, email: c.email },
      });
      clientes.push(cliente);
    }
    logs.push(`${clientes.length} clientes criados`);

    // 6b. Login para o primeiro cliente (Marcos Silva), para testar a área
    // do cliente (Cortano Client) — os demais seguem só como cadastro CRM.
    const usuarioClienteExistente = await prisma.usuario.findFirst({
      where: { tenantId: tenant.id, email: clientes[0].email! },
    });
    const usuarioCliente =
      usuarioClienteExistente ??
      (await prisma.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: clientes[0].nome,
          email: clientes[0].email!,
          senhaHash,
          papel: PapelUsuario.CLIENTE,
        },
      }));
    if (usuarioClienteExistente && !usuarioClienteExistente.senhaHash) {
      await prisma.usuario.update({
        where: { id: usuarioClienteExistente.id },
        data: { senhaHash },
      });
    }
    await prisma.cliente.update({
      where: { id: clientes[0].id },
      data: { usuarioId: usuarioCliente.id },
    });
    logs.push(`Login de cliente de teste: ${clientes[0].email} (senha: ${SENHA_PADRAO_SEED})`);

    // 7. Plano de cliente + assinatura
    const planoCorteBarba = await prisma.planoCliente.upsert({
      where: { id: "plano-cliente-corte-barba-seed" },
      update: {},
      create: {
        id: "plano-cliente-corte-barba-seed",
        tenantId: tenant.id,
        nome: "Plano Corte + Barba",
        precoMensal: 149.9,
        servicosInclusos: {
          create: [
            { servicoId: servicos.find((s) => s.nome === "Corte")!.id, quantidadeMes: 4 },
            { servicoId: servicos.find((s) => s.nome === "Barba")!.id, quantidadeMes: 4 },
          ],
        },
      },
    });

    await prisma.assinaturaCliente.upsert({
      where: { clienteId: clientes[0].id },
      update: {},
      create: {
        tenantId: tenant.id,
        clienteId: clientes[0].id,
        planoId: planoCorteBarba.id,
        status: "ATIVA",
        proximaCobranca: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });
    logs.push("Plano de cliente + 1 assinatura ativa");

    // 8. Agendamentos de exemplo
    const hoje = new Date();
    hoje.setHours(9, 0, 0, 0);

    const corte = servicos.find((s) => s.nome === "Corte")!;
    const barba = servicos.find((s) => s.nome === "Barba")!;
    const corteBarba = servicos.find((s) => s.nome === "Corte + Barba")!;

    const agendamentosSeed = [
      { cliente: clientes[0], barbeiro: barbeiro1, servico: corte, offsetMs: 0, status: "ATENDIDO" as const },
      { cliente: clientes[1], barbeiro: barbeiro1, servico: corteBarba, offsetMs: 2 * 60 * 60 * 1000, status: "CONFIRMADO" as const },
      { cliente: clientes[2], barbeiro: barbeiro2, servico: barba, offsetMs: 3 * 60 * 60 * 1000, status: "AGENDADO" as const },
      { cliente: clientes[3], barbeiro: barbeiro2, servico: corte, offsetMs: -24 * 60 * 60 * 1000, status: "CANCELADO" as const },
    ];

    let criados = 0;
    for (const a of agendamentosSeed) {
      const inicio = new Date(hoje.getTime() + a.offsetMs);
      const fim = new Date(inicio.getTime() + a.servico.duracaoMin * 60_000);

      const jaExiste = await prisma.agendamento.findFirst({
        where: { tenantId: tenant.id, clienteId: a.cliente.id, dataHoraInicio: inicio },
      });
      if (jaExiste) continue;

      await prisma.agendamento.create({
        data: {
          tenantId: tenant.id,
          clienteId: a.cliente.id,
          barbeiroId: a.barbeiro.id,
          dataHoraInicio: inicio,
          dataHoraFim: fim,
          status: a.status,
          valorTotal: a.servico.preco,
          servicos: { create: [{ servicoId: a.servico.id, precoCobrado: a.servico.preco }] },
        },
      });
      criados++;
    }
    logs.push(`${criados} agendamentos de exemplo criados`);

    return NextResponse.json({
      sucesso: true,
      logs,
      acesse: `/barbearia/${tenant.slug}/dashboard`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao rodar seed", detalhe: String(error), logsAteAqui: logs },
      { status: 500 }
    );
  }
}
