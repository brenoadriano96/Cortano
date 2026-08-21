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

## Setup local

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

4. Rode o projeto:
   ```bash
   npm run dev
   ```

5. Para testar multi-tenant localmente, adicione entradas no seu `/etc/hosts`:
   ```
   127.0.0.1 barbearia1.localhost
   ```
   E acesse `http://barbearia1.localhost:3000` (ajuste `ROOT_DOMAIN` no `.env` para `localhost:3000`).

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

## Roadmap (fases do MVP)

### Fase 1 — Operação (próximos passos)
- [ ] Autenticação (NextAuth) com papéis: Super Admin, Dono, Recepcionista, Barbeiro, Cliente
- [ ] CRUD de Barbeiros, Serviços, Clientes (páginas + APIs)
- [ ] Tela de Agenda (visualização diária/semanal por barbeiro)
- [ ] Fluxo de agendamento pelo cliente (área do cliente)
- [ ] Cadastro de nova barbearia (onboarding) + criação automática de subdomínio

### Fase 2 — Monetização
- [ ] Integração com gateway de pagamento (Stripe ou Pagar.me/Asaas para BRL)
- [ ] Cobrança recorrente de planos de cliente + webhook de confirmação
- [ ] Controle de utilização do plano (serviços usados/restantes)
- [ ] Cobrança da própria plataforma às barbearias (PlanoSaas)

### Fase 3 — Loja
- [ ] CRUD de produtos + estoque
- [ ] Carrinho e checkout na área do cliente
- [ ] Gestão de pedidos (status)

### Fase 4 — Inteligência
- [ ] Relatórios avançados (faturamento por barbeiro/serviço)
- [ ] Avaliações pós-atendimento
- [ ] Cupons, cashback, indicação

### Fase 5 — Ecossistema
- [ ] Integração WhatsApp (notificações automáticas)
- [ ] Multiunidades por barbearia
- [ ] PWA / App mobile
- [ ] White-label

## Decisões importantes em aberto

- **Gateway de pagamento**: Stripe é mais simples de integrar mas menos comum no
  Brasil (PIX, boleto). Pagar.me ou Asaas cobrem melhor o mercado BR. Decidir antes
  da Fase 2.
- **Autenticação multi-papel**: um único model `Usuario` com campo `papel` (como já
  modelado) simplifica login único; alternativa seria models separados por papel.
- **Isolamento de dados**: se algum cliente grande exigir isolamento físico no
  futuro, a migração de `tenantId` compartilhado para schema-per-tenant é possível
  mas trabalhosa — hoje a escolha prioriza velocidade de desenvolvimento.
