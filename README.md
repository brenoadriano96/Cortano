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

### Fase 4 — Inteligência
- [ ] Relatórios avançados (faturamento por barbeiro/serviço)
- [ ] Avaliações pós-atendimento
- [ ] Cupons, cashback, indicação

### Fase 5 — Ecossistema
- [ ] Integração WhatsApp (notificações automáticas)
- [ ] Multiunidades por barbearia
- [ ] PWA / App mobile
- [ ] White-label

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
