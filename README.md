# Cortano — Plataforma SaaS Multi-tenant para Barbearias

Plataforma multi-tenant para barbearias: agendamento, CRM, assinaturas recorrentes,
loja e financeiro. Baseado na arquitetura definida no planejamento inicial.

## Stack

- **Next.js 15 (App Router) + TypeScript** — front-end e back-end no mesmo projeto
- **PostgreSQL + Prisma ORM** — banco de dados e migrations
- **Tailwind CSS** — estilização
- **Zod** — validação de dados nas API routes
- **NextAuth.js** (a instalar) — autenticação
- **Stripe / Pagar.me / Asaas** (a integrar) — pagamentos e assinaturas

## Estratégia multi-tenant

Shared database com coluna discriminadora `tenantId` em todas as tabelas de domínio
(ver `prisma/schema.prisma`). Cada barbearia é um registro em `Tenant`.

Resolução do tenant:
- `middleware.ts` identifica o subdomínio (`barbearia1.plataforma.com`) e reescreve
  a URL internamente para `/barbearia/[tenant]/...`
- `src/lib/tenant.ts` busca o tenant no banco a partir do slug
- **Toda query em API routes e Server Components deve filtrar por `tenantId`** —
  nunca confiar em `tenantId` vindo do client sem validar contra a sessão autenticada

## Estrutura de pastas

```
src/app/
├── (landing)/                    # Landing page pública da plataforma
├── barbearia/[tenant]/           # Painel da barbearia (multi-tenant)
│   ├── dashboard/
│   ├── agenda/
│   ├── clientes/
│   ├── barbeiros/
│   ├── servicos/
│   ├── assinaturas/
│   ├── loja/
│   ├── pedidos/
│   ├── estoque/
│   ├── financeiro/
│   ├── relatorios/
│   ├── configuracoes/
│   └── cliente/                  # Área do cliente final (dentro do tenant)
│       ├── inicio/
│       ├── agendar/
│       ├── agendamentos/
│       ├── meu-plano/
│       ├── pagamentos/
│       ├── loja/
│       ├── pedidos/
│       └── perfil/
├── admin/                        # Super Admin da plataforma (dono do SaaS)
│   ├── barbearias/
│   ├── usuarios/
│   ├── assinaturas-saas/
│   ├── planos/
│   ├── financeiro/
│   └── configuracoes/
└── api/                           # API routes (agendamentos, clientes, webhooks...)
```

## Setup em produção (sem terminal — direto pelo painel)

Como o schema ainda não tem migrations versionadas, o `build` roda
`prisma db push` automaticamente a cada deploy, sincronizando o banco com o
`schema.prisma`. Isso significa que **só configurar `DATABASE_URL` no Netlify
e fazer o deploy já cria todas as tabelas** — sem precisar de terminal.

Depois do primeiro deploy bem-sucedido, popule o banco com dados de teste
acessando (no navegador, uma única vez):

```
https://SEU-SITE.netlify.app/api/dev/seed?key=SUA_SEED_SECRET
```

(configure `SEED_SECRET` no Netlify antes, com uma senha forte). A resposta
em JSON confirma o que foi criado e o link para acessar o dashboard da
barbearia de exemplo.

**Depois de usar, remova a variável `SEED_SECRET` do Netlify** (ou apague o
arquivo `src/app/api/dev/seed/route.ts`) para não deixar uma rota de escrita
exposta em produção indefinidamente.

## Setup local (com terminal)

1. Suba um Postgres local (ou use Neon/Supabase/Railway):
   ```bash
   docker run --name barbearia-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=barbearia_saas -p 5432:5432 -d postgres:16
   ```

2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```

3. Instale dependências e gere o client do Prisma:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Popule o banco com dados de teste (barbearia de exemplo, barbeiros, serviços,
   clientes e agendamentos):
   ```bash
   npx prisma db seed
   ```
   Depois de rodar, acesse `http://barbearia-modelo.localhost:3000/dashboard`
   (lembre de ter `barbearia-modelo.localhost` no seu `/etc/hosts`, ver abaixo).

5. Rode o projeto:
   ```bash
   npm run dev
   ```

6. Para testar multi-tenant localmente, adicione entradas no seu `/etc/hosts`:
   ```
   127.0.0.1 barbearia-modelo.localhost
   ```
   E acesse `http://barbearia-modelo.localhost:3000` (ajuste `ROOT_DOMAIN` no `.env`
   para `localhost:3000`).

## Etapa 1 — Fundação (concluída nesta rodada)

Seguindo a seção 25 do documento de arquitetura Cortano:

- [x] Schema completo do banco (Prisma): Tenant, RBAC (`PapelUsuario`), Planos SaaS
      com limites (`maxBarbeiros`, `maxClientes`...), `AssinaturaSaas` separada de
      `AssinaturaCliente` (seção 22), `AuditLog`, e as entidades operacionais
      (Barbeiro, Serviço, Cliente, Agendamento, Loja, Avaliações)
- [x] Status do tenant exatamente conforme seção 5: `TRIAL`, `ACTIVE`,
      `PAYMENT_PENDING`, `SUSPENDED`, `CANCELLED`
- [x] RBAC completo (`src/lib/rbac.ts`): mapa de permissões por papel
      (Super Admin, Proprietário, Gerente, Barbeiro, Atendente, Cliente — seção 4)
      + helper `podeAcessarTenant` para isolamento entre tenants
- [x] Validação de limites de plano no backend (`src/lib/planos.ts`) — seção 9,
      nunca hardcoded no frontend
- [x] Auditoria (`src/lib/auditoria.ts` + model `AuditLog`) — seção 21, chamada
      nas ações críticas (criar/suspender/reativar barbearia)
- [x] Bloqueio de acesso administrativo quando `SUSPENDED`/`CANCELLED` (seção 11),
      aplicado no layout do Cortano Business + tela de regularização
- [x] Middleware de resolução de tenant por subdomínio
- [x] Estrutura de rotas completa (Cortano Business / Cortano Client / Cortano Admin)
- [x] API do Cortano Admin: criar barbearia (com trial automático) e
      suspender/reativar/cancelar, com auditoria obrigatória
- [x] Dashboard operacional com métricas reais via Prisma (exemplo funcional)
- [x] API de agendamentos com validação e checagem de conflito de horário
      (exemplo de referência para as demais APIs)

**Importante:** o binário do Prisma não pôde ser baixado no ambiente sandbox
(rede restrita), então `npx prisma generate` não rodou aqui. O schema foi
validado estruturalmente (chaves balanceadas, 21 models, 8 enums). Rode
`npx prisma generate && npx prisma migrate dev --name init` no seu ambiente
local antes de iniciar — os erros de TypeScript sobre `PrismaClient` e
`PapelUsuario` somem assim que isso rodar.

## Autenticação (NextAuth / Auth.js v5)

Login por e-mail + senha (Credentials Provider), sessão JWT com `papel` e
`tenantId` embutidos — usados pelo RBAC (`src/lib/rbac.ts`) e pelos guards de
acesso nos layouts (`src/app/admin/layout.tsx` e
`src/app/barbearia/[tenant]/layout.tsx`).

Variável obrigatória: `AUTH_SECRET` (gere com `openssl rand -base64 32`).

Usuários criados pelo seed (senha padrão para todos: `cortano123`):
- `admin@cortano.com` — Super Admin → redireciona para `/admin`
- `proprietario@barbeariamodelo.com` — Proprietário
- `carlos@barbeariamodelo.com` / `pedro@barbeariamodelo.com` — Barbeiros
- `atendente@barbeariamodelo.com` — Atendente

**Troque essas senhas assim que possível** — são só para desenvolvimento/demo.

## Roadmap (fases do MVP)

### Fase 1 — Operação (concluída)
- [x] Autenticação (NextAuth) com papéis: Super Admin, Proprietário, Gerente, Barbeiro, Atendente, Cliente
- [x] CRUD de Barbeiros, Serviços, Clientes (páginas + server actions)
- [x] Tela de Agenda (visualização diária por barbeiro)
- [x] Fluxo de agendamento pelo cliente (área do cliente)
- [x] Cadastro de nova barbearia (onboarding) pelo Cortano Admin — trial
      automático de 14 dias; criação de subdomínio real (multi-tenant por
      domínio próprio) ainda pendente, hoje o acesso é por path
      (`/barbearia/[slug]`)

### Fase 2 — Monetização
- [x] Integração com gateway de pagamento — Stripe (Checkout + Webhook)
- [x] Cobrança recorrente de planos de cliente + webhook de confirmação
- [x] Controle de utilização do plano (serviços usados/restantes)
- [ ] Cobrança da própria plataforma às barbearias (PlanoSaas) — mesma
      infraestrutura do Stripe pode ser reaproveitada, ainda não implementado

### Fase 3 — Loja
- [x] CRUD de produtos + estoque (com controle de limite de plano — seção 9)
- [x] Carrinho e checkout na área do cliente (transacional — decrementa
      estoque atomicamente ao finalizar pedido, evitando venda de item sem
      estoque em compras simultâneas)
- [x] Gestão de pedidos (status: Novo → Pago → Preparando → Pronto p/
      retirada → Entregue, com cancelamento que devolve o estoque)

### Fase 4 — Inteligência (concluída)
- [x] Relatórios avançados (faturamento por barbeiro/serviço, ticket médio,
      nota média de avaliação — mês atual)
- [x] Avaliações pós-atendimento (cliente avalia barbeiro/serviço/experiência
      com estrelas após status ATENDIDO, uma vez por agendamento)
- [x] Cupons (percentual ou valor fixo, com validade e limite de usos —
      gerenciados em Configurações da barbearia, aplicáveis no checkout da loja)
- [x] Cashback (5% do valor pago em produtos, creditado só quando o pedido é
      entregue; pode ser usado como desconto em compras futuras)
- [x] Indicação de amigos (cliente indica pelo perfil; barbearia marca como
      convertido em Configurações, gerando cashback automático de R$ 20 para
      quem indicou)

### Fase 5 — Ecossistema (concluída)
- [x] Integração WhatsApp — notificações automáticas via Meta Cloud API
      (agendamento confirmado para cliente e barbearia, estoque baixo).
      Requer `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID`; sem essas variáveis, as
      notificações são só logadas no console, sem quebrar o fluxo principal
- [x] Multiunidades por barbearia — model `Unidade` (novo), barbeiros podem
      ser vinculados a uma unidade, agenda filtrável por unidade. Totalmente
      retrocompatível: tenants com uma única localização não precisam
      cadastrar nenhuma unidade e tudo continua funcionando como antes
- [x] PWA — `src/app/manifest.ts` + ícones em `public/`, instalável direto
      do navegador no celular (Adicionar à tela inicial)
- [x] White-label — cor de marca (`Tenant.corPrimaria`) e logo editáveis em
      Configurações, aplicados no header e nos botões de destaque da área
      do cliente

## WhatsApp (notificações automáticas)

**Setup:**
1. Crie um app em https://developers.facebook.com com o produto "WhatsApp"
2. Copie o token de acesso temporário (ou permanente, para produção) para
   `WHATSAPP_TOKEN`
3. Copie o "Phone number ID" para `WHATSAPP_PHONE_ID`

Sem essas variáveis, as notificações apenas aparecem no log do build/função
(`console.log`) em vez de serem enviadas — o app funciona normalmente, só
sem o envio real.

## Pagamentos (Stripe)

Assinatura CLIENTE -> BARBEARIA via Stripe Checkout (modo subscription).

**Setup:**
1. Crie uma conta em https://dashboard.stripe.com (modo teste já serve)
2. Copie a chave secreta (Developers -> API keys) para `STRIPE_SECRET_KEY`
3. Crie um endpoint de webhook (Developers -> Webhooks) apontando para
   `https://SEU-SITE.netlify.app/api/webhooks/stripe`, escutando pelo menos:
   `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
   `customer.subscription.deleted`
4. Copie o "Signing secret" do endpoint para `STRIPE_WEBHOOK_SECRET`

**Fluxo:** o cliente vê os planos disponíveis em "Meu Plano" (se ainda não
tem assinatura ativa) → clica "Assinar" → `/api/checkout/assinatura` cria uma
sessão do Stripe Checkout → cliente paga no Stripe → webhook
(`/api/webhooks/stripe`) confirma e ativa a `AssinaturaCliente` no banco.

**Nota:** Stripe não processa PIX/boleto nativamente para assinaturas
recorrentes no Brasil da mesma forma que cartão — para isso, Pagar.me ou
Asaas são mais adequados ao mercado BR (ver decisão em aberto abaixo). A
integração atual serve como base funcional completa (checkout + webhook);
trocar de gateway no futuro significa reescrever `src/lib/stripe.ts` e as
duas rotas de API, mantendo o mesmo modelo de dados.

## Melhorias solicitadas pelo usuário (pós-lançamento)

**Fase 1 — Correções críticas:**
- `financeiro/page.tsx` e `assinaturas/page.tsx` criados (antes davam 404 —
  as pastas existiam no menu mas nunca ganharam página)
- Dashboard: Faturamento e Assinaturas ativas agora só aparecem para quem
  tem acesso de gestão (`temAcessoGestao`) — corrige o Atendente (e o
  Barbeiro, temporariamente, até a reconstrução completa do dashboard dele)
  vendo dados financeiros que não deveriam

**Fase 2 — Edição completa (CRUD):**
- Clientes, Serviços, Produtos e Barbeiros agora têm um botão "Editar" que
  abre um modal (client component com `useActionState` + `useEffect` para
  fechar automaticamente após salvar com sucesso) — antes só existia
  criar/remover, sem editar
- `src/lib/comissoes.ts` (novo) — helper central de cálculo de comissão por
  atendimento (usa a comissão específica do serviço quando cadastrada,
  senão a comissão padrão do barbeiro), reaproveitado em Financeiro e
  preparado para Relatórios (Fase 4) e Dashboard do Barbeiro (Fase 5)

**Atenção técnica registrada:** ao integrar edição dentro de linhas de
tabela que já tinham um formulário de "Remover", cuidado para não aninhar
`<form>` dentro de `<form>` (HTML inválido, e o botão "Editar" herdaria
`type="submit"` do form pai, dispararia a remoção por engano). Corrigido
com `type="button"` explícito nos toggles dos modais e reestruturação para
formulários irmãos, nunca aninhados.

**Fase 3 — Gestão de perfis da equipe:**
- Nova seção "Perfis da equipe" em Configurações, visível só para
  Proprietário/Super Admin — cria Gerente/Atendente (Barbeiro continua
  cadastrado em Equipe, já que carrega dados extras como comissão),
  edita permissões granulares do Gerente (`Usuario.permissoes`, campo que
  já existia no schema mas nunca tinha interface), desativa perfil
- Ação de gerenciar perfis restrita ao Proprietário — mesmo um Gerente com
  acesso de gestão geral não pode criar outros perfis nem se auto-promover
  (`exigirProprietario`, separado de `exigirAcessoGestao`)

**Fase 4 — Relatórios: comissão + filtro de mês:**
- Nova coluna "A pagar (comissão)" ao lado de Ticket Médio, usando o mesmo
  `calcularComissoesPorBarbeiro` já criado na Fase 1
- Filtro de mês (`<input type="month">`) substitui o "mês atual" fixo —
  navega via query string (`?mes=AAAA-MM`), permitindo consultar qualquer
  mês retroativo

**Fase 5 — Dashboard dedicado do Barbeiro:**
- `dashboard/barbeiro-dashboard.tsx` (novo) — substitui completamente o
  dashboard genérico quando o papel é BARBEIRO: mostra "você tem a
  receber" (comissão do mês, usando `calcularComissoesPorBarbeiro` filtrado
  pelo próprio barbeiro) em vez de faturamento bruto do negócio, e já traz
  a agenda do dia e um resumo compacto da semana na própria tela inicial —
  sem precisar clicar em "Agenda" primeiro

**Fase 6 — Cliente: upgrade/downgrade + pedidos no dashboard:**
- **Meu Plano** — lista os outros planos disponíveis com botão "Trocar
  para este plano". Troca imediata, sem cobrança proporcional pelo tempo
  restante (decisão do produto). **Limitação registrada:** se a assinatura
  já tiver uma cobrança ativa via Stripe, o valor cobrado *no Stripe* não
  muda automaticamente — isso exigiria integrar a API de atualização de
  assinatura do Stripe, fica como próximo passo se a cobrança automática
  for retomada no futuro
- **Dashboard do Cliente** — novo card "Meus pedidos" mostrando os 3
  últimos pedidos da loja com status, direto na tela inicial

**Fase 7 — Cortano Admin: edição de registros já cadastrados:**
- **Barbearias** — edita nome, razão social, CNPJ, telefone, e-mail,
  endereço, responsável. O `slug` nunca é editável (mudar quebraria as
  URLs já em uso pela barbearia)
- **Planos SaaS** — edita preço e limites; mostra quantas barbearias usam
  o plano antes de salvar (mudar limites de um plano ativo afeta todas
  imediatamente)
- **Usuários administrativos** — edita só o nome; e-mail de login
  permanece não-editável por aqui (mesma decisão já tomada para barbeiros
  na Fase 2 — trocar e-mail merece fluxo próprio de confirmação)
- **Assinaturas SaaS** — edição manual de status/valor/próxima cobrança
  (`admin/assinaturas-saas/actions.ts`, novo arquivo — a página existia
  mas nunca teve actions), útil para ajustes de suporte já que não há
  cobrança automática real implementada. Editar aqui também sincroniza o
  status do `Tenant` correspondente

Todas as 4 edições são restritas a Super Admin e geram log de auditoria
(seção 21 — alteração de dados administrativos/financeiros é ação crítica).

## Auditoria de gaps e correções (pós-revisão completa)

Após revisão do documento de arquitetura original contra o que estava
implementado, foram identificados e corrigidos os seguintes gaps de
**Prioridade Alta**:

- **RBAC aplicado de verdade** — antes só existia o mapa de permissões
  (`src/lib/rbac.ts`) sem uso real. Agora: menu e acesso a páginas variam
  por papel (`src/lib/acesso-pagina.ts`). Financeiro, Configurações,
  Relatórios, Unidades, gestão de Equipe/Loja/Pedidos são exclusivos de
  Proprietário/Gerente/Super Admin (seção 4.2/4.3). Barbeiro só vê a
  própria agenda e os próprios clientes atendidos, sem formulário de criar
  cliente/agendamento para outros (seção 4.4)
- **Auditoria expandida ao Business** — antes só o Cortano Admin gerava
  logs. Agora ações administrativas dentro da barbearia também são
  auditadas: adicionar/remover barbeiro, alterar branding, criar cupom,
  converter indicação (seção 21)
- **Self-signup do cliente** (seção 4.6: "criar conta") —
  `/barbearia/[slug]/cadastro-cliente`, rota pública que não passa pela
  guarda de autenticação do layout (exceção tratada via header de pathname
  propagado pelo middleware). Login (`/login?tenant=slug`) mostra link
  "Criar conta" quando o parâmetro `tenant` está presente
- **Validação de horário de expediente + bloqueio de agenda** (seção 14)
  — `src/lib/disponibilidade.ts` centraliza a checagem: expediente
  cadastrado (`HorarioTrabalho`), bloqueios (`BloqueioAgenda` — novo model,
  para folga/almoço/feriado) e conflito com outro agendamento. Usado tanto
  na Agenda do negócio quanto no autoagendamento do cliente. Bloqueios são
  geridos na própria tela de Agenda, restrito a quem tem acesso de gestão

**Prioridade Média (concluída):**
- **Perfil detalhado do cliente** —
  `/barbearia/[slug]/clientes/[id]`: histórico completo de agendamentos,
  compras na loja, avaliações dadas, total gasto (Barbeiro só vê o que é
  relevante aos próprios atendimentos, seção 4.4)
- **Reagendamento** — tanto no Business (Agenda) quanto no Client (Meus
  agendamentos), mantendo cliente/barbeiro/serviços e revalidando
  disponibilidade (`validarDisponibilidade` ganhou parâmetro para ignorar
  o próprio agendamento na checagem de conflito)
- **Agenda semanal** — alternância Dia/Semana na tela de Agenda; visão
  semanal mostra uma grade barbeiro × dia com contagem de atendimentos,
  clicável para abrir o dia específico
- **Página "Pagamentos" separada no Client** —
  `/barbearia/[slug]/cliente/pagamentos`, reunindo cobranças da assinatura
  e compras na loja; "Meu Plano" ficou focado só nas informações do plano

**Prioridade Baixa (concluída):**
- **Upload de imagem** — `src/components/upload-imagem.tsx` (reutilizável),
  usado em Produto, Serviço, Barbeiro e Logo da barbearia. Converte a
  imagem para base64 no navegador (limite 2MB) — funcional para o MVP sem
  depender de um provedor de storage externo (S3/Cloudinary) ainda não
  configurado; migrar para um bucket de objetos é o próximo passo natural
  quando o volume de fotos crescer
- **Comissão por serviço editável** — cada barbeiro mostra, na própria
  tela de Equipe, um editor inline de comissão por serviço que já realiza
  (sobrescreve a comissão padrão — seção 15)
- **Categorias de produto normalizadas** — novo model `CategoriaProduto`
  (seção 19: "product_categories"), com criação pela própria tela da Loja;
  produtos existentes continuam funcionando (campo `categoria` de texto
  mantido por compatibilidade)
- **Métricas de churn e novos clientes no Admin** — cards de "Novas
  barbearias (mês)" e "Churn (mês)" na Visão Geral (aproximação: baseada
  em `updatedAt` das barbearias canceladas, já que não há uma tabela de
  histórico de status dedicada ainda)

Cobrança automática da barbearia (Barbearia → Cortano) foi decidida como
**fora de escopo por ora** — sem cobrança recorrente real pelo site nesta
fase.

## Decisões importantes em aberto

- **Gateway de pagamento**: Stripe já integrado (Checkout + Webhook) como base
  funcional. Para PIX/boleto nativos ao mercado brasileiro, considerar migrar
  para Pagar.me ou Asaas — a troca fica isolada em `src/lib/stripe.ts` e nas
  rotas `/api/checkout/*` e `/api/webhooks/*`.
- **Autenticação multi-papel**: um único model `Usuario` com campo `papel` (como já
  modelado) simplifica login único; alternativa seria models separados por papel.
- **Isolamento de dados**: se algum cliente grande exigir isolamento físico no
  futuro, a migração de `tenantId` compartilhado para schema-per-tenant é possível
  mas trabalhosa — hoje a escolha prioriza velocidade de desenvolvimento.
