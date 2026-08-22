import { PrismaClient, PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SENHA_PADRAO_SEED = "cortano123";

/**
 * Seed de dados de teste — cria um cenário completo para visualizar as
 * telas do Cortano Business e Cortano Client com dados reais:
 * - 1 plano SaaS (Pro)
 * - 1 barbearia (tenant) de exemplo, já ACTIVE
 * - 1 usuário Super Admin
 * - 1 usuário Proprietário + 2 Barbeiros + 1 Atendente
 * - 4 serviços
 * - 5 clientes
 * - alguns agendamentos (passados e futuros) para o dashboard mostrar dados
 * - 1 plano de assinatura de cliente + 1 assinatura ativa
 *
 * Rodar com: npx prisma db seed
 * (ou: npx tsx prisma/seed.ts)
 */
async function main() {
  console.log("Iniciando seed...");
  const senhaHash = await bcrypt.hash(SENHA_PADRAO_SEED, 10);
  console.log(`Senha padrão para todos os usuários de teste: ${SENHA_PADRAO_SEED}`);

  // ---------------------------------------------------------------------
  // 1. Plano SaaS
  // ---------------------------------------------------------------------
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
  console.log("✔ Plano SaaS:", planoPro.nome);

  // ---------------------------------------------------------------------
  // 2. Tenant (barbearia) de exemplo
  // ---------------------------------------------------------------------
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
  console.log("✔ Tenant:", tenant.nome, `(slug: ${tenant.slug})`);

  // Assinatura SaaS correspondente
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

  // ---------------------------------------------------------------------
  // 3. Usuários (Super Admin + equipe da barbearia)
  // ---------------------------------------------------------------------
  const superAdminExistente = await prisma.usuario.findFirst({
    where: { email: "admin@cortano.com", papel: PapelUsuario.SUPER_ADMIN },
  });
  const superAdmin =
    superAdminExistente ??
    (await prisma.usuario.create({
      data: {
        tenantId: null,
        nome: "Admin Cortano",
        email: "admin@cortano.com",
        senhaHash,
        papel: PapelUsuario.SUPER_ADMIN,
      },
    }));
  console.log("✔ Super Admin:", superAdmin.email);

  const proprietario = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "proprietario@barbeariamodelo.com" } },
    update: {},
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
    update: {},
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
    update: {},
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
    update: {},
    create: {
      tenantId: tenant.id,
      nome: "Ana Atendente",
      email: "atendente@barbeariamodelo.com",
      senhaHash,
      papel: PapelUsuario.ATENDENTE,
    },
  });
  console.log("✔ Usuários da equipe criados");

  // ---------------------------------------------------------------------
  // 4. Barbeiros
  // ---------------------------------------------------------------------
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
  console.log("✔ Barbeiros:", barbeiro1.nome, "e", barbeiro2.nome);

  // ---------------------------------------------------------------------
  // 5. Serviços
  // ---------------------------------------------------------------------
  const servicosData = [
    { nome: "Corte", preco: 45, duracaoMin: 30 },
    { nome: "Barba", preco: 30, duracaoMin: 20 },
    { nome: "Corte + Barba", preco: 65, duracaoMin: 50 },
    { nome: "Sobrancelha", preco: 20, duracaoMin: 15 },
  ];

  const servicos = [];
  for (const s of servicosData) {
    const servico = await prisma.servico.upsert({
      where: { id: `servico-seed-${s.nome.toLowerCase().replace(/[\s+]/g, "-")}` },
      update: {},
      create: {
        id: `servico-seed-${s.nome.toLowerCase().replace(/[\s+]/g, "-")}`,
        tenantId: tenant.id,
        nome: s.nome,
        preco: s.preco,
        duracaoMin: s.duracaoMin,
        barbeiros: {
          create: [
            { barbeiroId: barbeiro1.id },
            { barbeiroId: barbeiro2.id },
          ],
        },
      },
    });
    servicos.push(servico);
  }
  console.log(`✔ ${servicos.length} serviços criados`);

  // ---------------------------------------------------------------------
  // 6. Clientes
  // ---------------------------------------------------------------------
  const clientesData = [
    { nome: "Marcos Silva", telefone: "(82) 99999-0001", email: "marcos@exemplo.com" },
    { nome: "Rafael Souza", telefone: "(82) 99999-0002", email: "rafael@exemplo.com" },
    { nome: "Bruno Costa", telefone: "(82) 99999-0003", email: "bruno@exemplo.com" },
    { nome: "Felipe Lima", telefone: "(82) 99999-0004", email: "felipe@exemplo.com" },
    { nome: "Gustavo Alves", telefone: "(82) 99999-0005", email: "gustavo@exemplo.com" },
  ];

  const clientes = [];
  for (const c of clientesData) {
    const cliente = await prisma.cliente.upsert({
      where: { id: `cliente-seed-${c.email.split("@")[0]}` },
      update: {},
      create: {
        id: `cliente-seed-${c.email.split("@")[0]}`,
        tenantId: tenant.id,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
      },
    });
    clientes.push(cliente);
  }
  console.log(`✔ ${clientes.length} clientes criados`);

  // ---------------------------------------------------------------------
  // 7. Plano de cliente (assinatura recorrente) + 1 assinatura ativa
  // ---------------------------------------------------------------------
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
  console.log("✔ Plano de cliente + 1 assinatura ativa");

  // ---------------------------------------------------------------------
  // 8. Agendamentos (hoje + próximos dias, com status variados)
  // ---------------------------------------------------------------------
  const hoje = new Date();
  hoje.setHours(9, 0, 0, 0);

  const corte = servicos.find((s) => s.nome === "Corte")!;
  const barba = servicos.find((s) => s.nome === "Barba")!;
  const corteBarba = servicos.find((s) => s.nome === "Corte + Barba")!;

  const agendamentosSeed = [
    {
      cliente: clientes[0],
      barbeiro: barbeiro1,
      servico: corte,
      inicio: new Date(hoje.getTime() + 0),
      status: "ATENDIDO" as const,
    },
    {
      cliente: clientes[1],
      barbeiro: barbeiro1,
      servico: corteBarba,
      inicio: new Date(hoje.getTime() + 2 * 60 * 60 * 1000),
      status: "CONFIRMADO" as const,
    },
    {
      cliente: clientes[2],
      barbeiro: barbeiro2,
      servico: barba,
      inicio: new Date(hoje.getTime() + 3 * 60 * 60 * 1000),
      status: "AGENDADO" as const,
    },
    {
      cliente: clientes[3],
      barbeiro: barbeiro2,
      servico: corte,
      inicio: new Date(hoje.getTime() - 24 * 60 * 60 * 1000),
      status: "CANCELADO" as const,
    },
  ];

  for (const a of agendamentosSeed) {
    const fim = new Date(a.inicio.getTime() + a.servico.duracaoMin * 60_000);
    await prisma.agendamento.create({
      data: {
        tenantId: tenant.id,
        clienteId: a.cliente.id,
        barbeiroId: a.barbeiro.id,
        dataHoraInicio: a.inicio,
        dataHoraFim: fim,
        status: a.status,
        valorTotal: a.servico.preco,
        servicos: {
          create: [{ servicoId: a.servico.id, precoCobrado: a.servico.preco }],
        },
      },
    });
  }
  console.log(`✔ ${agendamentosSeed.length} agendamentos de exemplo criados`);

  console.log("\nSeed concluído com sucesso!");
  console.log(`\nAcesse a barbearia de exemplo em: /barbearia/${tenant.slug}/dashboard`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
