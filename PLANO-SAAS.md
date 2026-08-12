# Plano SaaS — VAULTO

> **Objetivo deste documento:** registrar a análise e o plano de transformação do
> Vaulto em um SaaS com assinaturas mensais, para que o trabalho possa ser
> retomado em qualquer sessão futura sem depender do histórico da conversa.
> Sempre que uma etapa for concluída, atualize o `Status` correspondente.

## 0. Origem deste plano

Este plano cruza duas fontes:

1. Uma conversa com o ChatGPT (compartilhada em
   `chatgpt.com/share/6a758138-b63c-83e9-ba17-05e09932b46c`) sobre precificação,
   gateways de pagamento, hospedagem e roadmap de funcionalidades para o Vaulto
   virar SaaS.
2. Uma auditoria do estado atual do código em `backend-vaulto` e
   `frontend-vaulto` nesta sessão, para não recomendar nada que já exista.

As recomendações do ChatGPT são hipóteses de planejamento, não garantias de
mercado nem aconselhamento jurídico/tributário — isso é sinalizado de novo na
seção 6.

## 1. Estado atual do produto (auditoria — o que já existe)

Não reimplementar nada desta lista. Serve de base para as próximas fases.

### Backend (`backend-vaulto`, NestJS + GraphQL + TypeORM/Postgres)

- Arquitetura em camadas por módulo (`domain` / `application` / `infrastructure`
  / `presentation`), documentada em `ARCHITECTURE.md` e `ADR-0001-nova-arquitetura-vaulto.md`.
- Módulos existentes: `auth`, `users`, `debts`, `incomes`, `income-receipts`,
  `payments`, `categories`, `credit-cards`, `reports`, `sessions`, `mails`,
  `pdf-generator`.
- Autenticação: login usuário/senha, **login com Google OAuth já implementado**
  (`LoginWithGoogleUseCase`), troca de senha obrigatória no primeiro acesso,
  recuperação de senha por e-mail, refresh token via cookie httpOnly, rate
  limiting por tier (Upstash Redis) já implementado.
- Autorização: grupos `USER` / `ADMIN` / `ADMIN_MASTER` (papéis internos do
  Vaulto, não são "tenants" de clientes) + sistema de permissões
  (`AuthPermission`) e de acesso por página (`PageAccessKey`) com overrides por
  usuário.
- Onboarding de novos usuários: tour guiado interativo pós-login (implementado
  nesta mesma sessão), com flag `onboardingTourCompleted` persistida em
  `tb_auth_credentials`.
- Domínio financeiro (tudo já funcional, escopado por usuário via `idUsers`):
  - Dívidas: à vista ou parceladas, vínculo opcional com cartão de crédito
    (calcula vencimento pela fatura automaticamente), status automático
    (aberto/parcial/pago/vencido).
  - Pagamentos: parciais ou totais, com aplicação automática de excedente na
    próxima parcela.
  - Receitas e Recebimentos: espelham Dívidas/Pagamentos, com opção de
    recorrência.
  - Cartões de crédito: limite, dia de fechamento/vencimento, cálculo de
    fatura e verificação de limite disponível.
  - Categorias: por tipo (despesa/receita).
  - Dashboard (kanban por status) e Extratos (relatório detalhado por período,
    já usa `reports` module).
  - Módulo `pdf-generator`: motor de templates PDF já existe (usado hoje para
    orçamentos/contratos) — pode ser **reaproveitado** para exportação de
    relatório financeiro em PDF (Fase 4).
- E-mail transacional via Brevo já integrado (`mails` module): boas-vindas,
  senha alterada, recuperação de senha.

### Frontend (`frontend-vaulto`, React + Vite + Tailwind, BFF Express em `server/`)

- Design system em atomic design (`atoms` / `molecules` / `organisms` /
  `templates`) com tokens em `src/config/theme.ts`.
- Todas as telas do domínio financeiro acima já existem (Dashboard, Dívidas,
  Pagamentos, Receitas, Recebimentos, Cartões, Categorias, Extratos, Usuários,
  Perfil, Manual/Ajuda).
- BFF (`server/`) traduz REST → GraphQL para o backend, incluindo rate limiting
  próprio.
- Tour de onboarding guiado (implementado nesta sessão).

### Infraestrutura atual (conforme informado na conversa com o ChatGPT)

| Serviço         | Uso hoje                              |
| --------------- | ------------------------------------- |
| Vercel          | Frontend + Backend (plano Hobby/Free) |
| Neon PostgreSQL | Banco de dados (Free)                 |
| Upstash Redis   | Rate limiting (Free)                  |
| Brevo           | E-mail transacional (Free)            |
| Google OAuth    | Login social (sem custo)              |
| Stripe          | Cogitado, ainda não integrado         |

### O que **não existe ainda** (é o que este plano constrói)

- Qualquer entidade de plano/assinatura/pagamento no backend.
- Qualquer integração com gateway de pagamento.
- Qualquer limite de uso por plano (Free vs Pro) — hoje tudo é ilimitado para
  todo usuário.
- Período de trial.
- Funcionalidades premium sugeridas (lembretes, calendário financeiro,
  previsão financeira, saúde financeira, metas, comparativos, importação de
  extrato, Vaulto Insights/IA).
- Migração de hospedagem para uso comercial.

## 2. Modelo de negócio proposto

### 2.1 Planos e preços (recomendação final da análise)

| Plano                    | Preço                | Observação                                                |
| ------------------------ | -------------------- | --------------------------------------------------------- |
| **Free**                 | R$ 0                 | Precisa ser realmente útil (aquisição), não "capado"      |
| **Pro**                  | R$ 14,90/mês         | Preço-âncora recomendado; validar com dados reais         |
| **Pro Anual**            | R$ 149,90/ano        | ≈ R$ 12,49/mês — desconto de ~16% sem corroer o ticket    |
| Trial                    | 7 dias grátis do Pro | Sem cobrar; ao fim, oferece assinar                       |
| _(futuro)_ Vaulto Family | R$ 24,90–29,90/mês   | Conta compartilhada (ex.: casal), ver Fase 6              |
| _(futuro)_ Vaulto AI     | R$ 24,90/mês         | Upsell de IA avançada sobre o Vaulto Insights, ver Fase 6 |

Preço não precisa ser travado agora: a estratégia recomendada é lançar Free +
Pro R$ 14,90 com trial de 7 dias e medir (% que atinge limite do Free, % que
testa o Pro, % que converte, % que cancela) antes de reajustar.

### 2.2 Limites do Free vs recursos do Pro

| Recurso                                     | Free                                 | Pro                         |
| ------------------------------------------- | ------------------------------------ | --------------------------- |
| Dívidas                                     | até 5                                | ilimitado                   |
| Cartões de crédito                          | 1                                    | ilimitado                   |
| Receitas                                    | até 10/mês                           | ilimitado                   |
| Pagamentos/Recebimentos                     | ilimitado (dentro dos limites acima) | ilimitado                   |
| Categorias                                  | básicas (predefinidas)               | personalizadas + ilimitadas |
| Extratos/histórico                          | últimos 3 meses                      | histórico completo          |
| Filtros                                     | básicos                              | avançados                   |
| Relatórios                                  | básicos                              | avançados + comparativos    |
| Exportação (PDF/Excel)                      | ❌                                   | ✅                          |
| Lembretes                                   | ❌                                   | ✅                          |
| Calendário financeiro                       | ❌                                   | ✅                          |
| Previsão financeira / "quanto posso gastar" | ❌                                   | ✅                          |
| Metas financeiras                           | ❌                                   | ✅                          |
| Importação de extrato (CSV/OFX)             | ❌                                   | ✅                          |
| Vaulto Insights (IA)                        | ❌                                   | ✅                          |
| Backup                                      | básico                               | completo                    |

Regra de produto: quando o usuário Free atinge um limite, mostrar um CTA
contextual ("Você atingiu o limite de 5 dívidas. Desbloqueie o Vaulto Pro
para continuar sem limites.") em vez de simplesmente bloquear a ação sem
explicação.

### 2.3 Gateway de pagamento

Recomendação: **Asaas** como gateway principal (não Stripe).

Motivo: para valores baixos (R$ 14,90) e mercado brasileiro, o Asaas tem taxa
menor que a Stripe (~R$ 0,49 + 2,99% no cartão vs Stripe 3,99% + R$ 0,39 + 0,7%
extra do Stripe Billing para assinaturas), além de Pix nativo e API/webhooks
para recorrência. Mercado Pago e Pagar.me são alternativas viáveis mas com
tabela de taxas menos transparente publicamente; Iugu não teve taxa pública
confirmada na pesquisa.

Não integrar múltiplos gateways de uma vez. Começar com **um único provedor**
cobrindo cartão recorrente + Pix, checkout hospedado, webhooks, cancelamento,
renovação automática e controle de inadimplência.

## 3. Roadmap de implementação por fases

> Cada fase tem `Status`: `Não iniciado` / `Em andamento` / `Concluído`.
> Atualize ao trabalhar nela. Comece pela primeira fase que não estiver
> `Concluído`.

### Fase 0 — Modelagem de billing no backend

**Status:** Concluído (branch `feat/fase-0-billing-foundation`, a partir de
`project/vaulto-saas`)
**Repositório:** `backend-vaulto`

Objetivo: ter as entidades e o esqueleto do módulo `billing`, sem gateway real
ainda (paga-se "na mão"/manual ou fica tudo Free por enquanto).

- [x] Criar módulo `src/modules/billing` seguindo o padrão
      `domain/application/infrastructure/presentation` do projeto.
- [x] Entidade `SubscriptionEntity` (`tb_subscriptions`): `idUsers` (1:1 com
      `UserEntity`), `plan` (`FREE` | `PRO`), `status` (`ACTIVE` | `TRIALING` |
      `PAST_DUE` | `CANCELED` | `EXPIRED`), `trialEndsAt`, `currentPeriodEnd`,
      `cancelAtPeriodEnd`, `gatewayCustomerId`, `gatewaySubscriptionId`.
- [ ] ~~Entidade `PaymentEntity`~~ — adiada para a Fase 1: sem um gateway real
      ainda escrevendo nela, o formato exato dependeria de um payload de
      webhook que ainda não existe. Criar junto com a integração do Asaas.
- [x] Migration criando `tb_subscriptions` (seguindo o padrão de
      `src/database/migrations/*`, escrita manual como as últimas migrations,
      sem depender de `migration:generate` contra um banco real).
- [x] Ao criar um usuário (`create-user.use-case.ts` e
      `login-with-google.use-case.ts` no fluxo de auto-cadastro), criar
      automaticamente uma `Subscription` com `plan = FREE`.
- [x] `PlanLimitsService` (novo, em `billing/application`): expõe
      `assertCanCreate(idUsers, resource, currentCount)` lançando
      `AppException` (novo catálogo `APP_ERRORS.billing.*`) quando o limite do
      Free for excedido. `currentCount` é calculado por quem chama (via
      `listByUser(..., { limit: 1 })` de cada módulo) para o billing não
      depender dos repositórios de debts/credit-cards/incomes e criar um ciclo
      de módulos.
- [x] Chamar `PlanLimitsService.assertCanCreate` dentro de
      `create-debt`, `create-credit-card` e `create-income` use cases
      (mesmo padrão de `AuthorizationService.assertPermissionForUserId` já
      usado nesses fluxos).
- [x] Expor query GraphQL `mySubscription` (plano, status, `trialEndsAt`,
      `currentPeriodEnd`, `cancelAtPeriodEnd`) para o frontend consumir.
- [x] Suíte de testes cobrindo `PlanLimitsService` (todos os recursos, plano
      PRO ignorando limite, usuário sem assinatura tratado como FREE),
      `CreateDefaultSubscriptionUseCase` e `GetMySubscriptionUseCase`, além dos
      testes existentes de `create-debt`/`create-credit-card`/`create-income`
      atualizados para o novo limite.

### Fase 1 — Integração com gateway de pagamento (Asaas)

**Status:** Concluído (backend na branch `feat/fase-1-asaas-integration`,
frontend na branch `feat/fase-1-billing-frontend`, ambas a partir de
`project/vaulto-saas`)
**Repositório:** `backend-vaulto` + `frontend-vaulto`

- [x] Criar conta Asaas (sandbox primeiro).
- [x] Entidade `BillingPaymentEntity` (`tb_billing_payments` — nome livre
      desde que não colida com o `payments` module já existente, que é sobre
      pagamento de dívidas do usuário, não da assinatura) + migration:
      histórico de cobranças (`amount`, `status`, `gatewayPaymentId`,
      `paidAt`, `idUsers`).
- [x] Backend: `AsaasPaymentGatewayProvider` (infrastructure, atrás da porta
      `PaymentGatewayPort`) encapsulando chamadas à API do Asaas via `fetch`
      nativo do Node — sem dependência nova (criar cliente, criar
      assinatura/cobrança recorrente).
- [x] Mutation `subscribeToPro` (GraphQL) — cria cliente + assinatura no
      Asaas (`billingType: UNDEFINED`, checkout hospedado — o cliente escolhe
      Pix/Boleto/Cartão), inicia trial de 7 dias, aceita `billingCycle`
      (`MONTHLY` R$ 14,90 ou `YEARLY` R$ 149,90), retorna `checkoutUrl`.
      **Importante**: hoje só o Cartão de Crédito é cobrado automaticamente a
      cada ciclo pelo checkout hospedado — Pix e Boleto exigem que o cliente
      pague manualmente o link a cada vencimento. Pix realmente automático é
      a Fase 1.5.
- [x] Webhook receiver (`POST /webhooks/asaas`, REST) validando o header
      `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` antes de processar
      qualquer coisa, atualizando `SubscriptionEntity.status` e registrando
      `BillingPaymentEntity` a cada evento de cobrança (`PAYMENT_CONFIRMED`,
      `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`,
      `PAYMENT_REFUNDED`) e de assinatura (`SUBSCRIPTION_DELETED`,
      `SUBSCRIPTION_INACTIVATED`). **Nunca liberar o Pro a partir de uma
      resposta do frontend — só via webhook confirmado.**
- [x] Configurar o webhook no painel da Asaas (URL
      `https://api-vaulto.vercel.app/webhooks/asaas`, versão v3, "Gerar
      Token" → copiar para `ASAAS_WEBHOOK_TOKEN`, tipo de envio Sequencial,
      eventos: os 5 de Cobranças e os 2 de Assinaturas listados acima).
- [x] 34 testes novos cobrindo o gateway (fetch mockado, sandbox vs.
      produção, erros de rede/API), o `subscribeToPro` (mensal, anual,
      reaproveitar cliente existente, já assinante, usuário não encontrado) e
      todos os eventos de webhook tratados.
- [x] BFF (`frontend-vaulto/server`): rotas REST `/billing/*`
      (`GET /billing`, `POST /billing/subscribe`) espelhando o padrão já
      usado em `server/src/modules/auth` (queries.js/service.js/routes.js)
      para expor a mutation `subscribeToPro` e a query `mySubscription` ao
      frontend sem GraphQL direto. Também adicionada `GET /users/me`
      (query `me` já existente no backend) para os dados de perfil.
- [x] Frontend: nova página `/planos` (`src/pages/Plans.tsx`) comparando
      Free vs Pro (cards de preço + tabela de recursos), com modal de
      assinatura (`SubscribeToProModal`: escolha de ciclo mensal/anual +
      CPF/CNPJ) que redireciona para o `checkoutUrl` hospedado da Asaas.
      Novo `features/billing` (`BillingProvider`/`useBillingContext`)
      espelha o padrão do `features/onboarding`.
- [x] Frontend: página de Perfil (`src/pages/Profile.tsx`) reescrita para
      mostrar dados reais do usuário (nome, e-mail, usuário, avatar, data
      de criação da conta) via `ProfileSummaryCard`, e o status da
      assinatura (Free/Pro/Trial/Vencida/Cancelada) via
      `SubscriptionStatusCard`, com atalho para `/planos`.
- [ ] **Adiado (decisão explícita nesta sessão):** gerenciamento de
      assinatura (cancelar, ver próxima cobrança/data, histórico de
      pagamentos) — hoje a tela de Perfil só exibe o status, sem ações de
      cancelamento. Fica para um incremento futuro (endpoint de
      cancelamento que agenda `cancelAtPeriodEnd = true` no backend +
      tela/menu dedicado no frontend), a decidir se entra na Fase 2 ou
      numa fase própria.

### Fase 1.5 — Pix Automático (recorrência real via Pix)

**Status:** Não iniciado
**Repositório:** `backend-vaulto` + `frontend-vaulto`

Decisão registrada nesta sessão: adiada da Fase 1 porque é um modelo
**paralelo e incompatível** com o de Assinaturas usado na Fase 1 — a própria
Asaas recomenda não misturar as duas estratégias de recorrência no mesmo
fluxo de negócio. Diferença principal: numa Assinatura comum a Asaas gera as
cobranças sozinha; no Pix Automático é o nosso backend quem precisa criar
cada cobrança ("instrução de pagamento") individualmente, entre 2 e 10 dias
úteis antes do vencimento — não existe geração automática pela Asaas aqui.

- [ ] Endpoint `POST /v3/pix/automatic/authorizations` (novo
      `PaymentGatewayPort.createPixAutomaticAuthorization` ou porta
      dedicada): cria a autorização (`frequency`, `contractId`, `startDate`,
      `customerId`, `immediateQrCode.{expirationSeconds,originalValue}`) e
      retorna o QR Code (`payload` + `encodedImage`) da primeira cobrança +
      consentimento.
- [ ] Nova entidade `PixAutomaticAuthorizationEntity` vinculada à
      `SubscriptionEntity` (status `CREATED` | `ACTIVE` | `CANCELLED` |
      `REFUSED` | `EXPIRED`).
- [ ] **Agendador/cron novo no backend** (não existe hoje) que, para cada
      autorização `ACTIVE`, cria a próxima instrução de pagamento na janela
      de 2 a 10 dias úteis antes do vencimento.
- [ ] Webhook: tratar os 10 eventos de
      `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_*` e
      `PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_*` (ver
      `docs.asaas.com/docs/eventos-para-pix-automático`).
- [ ] Frontend: tela mostrando o QR Code de autorização e o status
      (aguardando pagamento → ativo), no fluxo de assinatura como alternativa
      ao checkout hospedado.

### Fase 2 — Feature gating no frontend

**Status:** Concluído (branch `feat/fase-2-feature-gating`, a partir de
`project/vaulto-saas`)
**Repositório:** `frontend-vaulto`

- [x] `features/billing` (`BillingProvider`/`useBillingContext`) já existia
      desde a Fase 1 (mesmo padrão de `features/onboarding`) — reaproveitado
      aqui, sem necessidade de um novo context.
- [x] Componentes de UI (atomic design): `atoms/PlanBadge` (Fase 1),
      `molecules/UpgradeBanner`, `organisms/UpgradeModal` (novos) —
      mostrados quando uma ação bate no limite do Free. O backend continua
      sendo a única fonte de verdade: `createDebt`/`createCreditCard`/
      `createIncome` agora reconhecem o código `BILLING_PLAN_LIMIT_REACHED`
      da resposta e lançam um `PlanLimitReachedError` tipado, que os hooks
      (`useDebts`/`useCreditCards`/`useIncomes`) capturam separadamente para
      abrir o `UpgradeModal` em vez de um toast de erro genérico. O
      front-end não duplica a regra de limite — só traduz o erro do backend
      em UI.
- [x] Indicadores de uso (ex.: "3 de 5 dívidas usadas") nas telas de Dívidas,
      Cartões e Receitas para usuários Free, via `UpgradeBanner` (usa a
      contagem real da paginação do backend, não um cálculo local).
- [x] Botão "Nova dívida"/"Novo cartão"/"Nova receita" agora abre o
      `UpgradeModal` direto ao clicar quando o limite já foi atingido, em
      vez de deixar o usuário preencher o formulário inteiro para só então
      descobrir o erro. Puramente cosmético: a validação que realmente
      impede a gravação continua 100% no backend (`PlanLimitsService`,
      Fase 0) e não pode ser burlada manipulando o frontend.
- [x] Página de preços (`/planos`) comparando Free vs Pro — já entregue na
      Fase 1 junto com a página de Perfil.

### Fase 3 — Trial e ciclo de vida da assinatura

**Status:** Concluído (branch `feat/fase-3-subscription-lifecycle`, a partir
de `project/vaulto-saas`) — **requer 1 passo manual pós-merge**, ver abaixo
**Repositório:** `backend-vaulto` (sem mudanças no frontend — o
`PlanBadge`/`SubscriptionStatusCard` da Fase 1 já tratam `PAST_DUE` e
`EXPIRED`)

- [x] Iniciar `TRIALING` de 7 dias ao assinar — **já entregue na Fase 1**
      (`SubscribeToProUseCase`), só confirmado/documentado aqui.
- [x] Job/rotina para avisos e downgrade: como o backend roda como função
      serverless na Vercel (`vercel.json`), um agendador **dentro do
      processo** (`@nestjs/schedule`) não funcionaria de forma confiável —
      não há processo vivo entre requisições para um timer sobreviver.
      Implementado como endpoint `GET /internal/billing/subscription-lifecycle`
      (`SubscriptionLifecycleController`), protegido por
      `Authorization: Bearer $CRON_SECRET`, chamado 1x/dia por um **Vercel
      Cron Job** configurado em `vercel.json` (`0 9 * * *`, permitido no
      plano Hobby). Vercel injeta esse header automaticamente quando
      `CRON_SECRET` está configurado no projeto.
      **Passo manual pendente:** configurar a env var `CRON_SECRET` (mín. 16
      caracteres) no painel da Vercel — sem isso o endpoint sempre rejeita
      (403), inclusive as chamadas do próprio Cron Job.
- [x] `RunSubscriptionLifecycleUseCase`: envia lembrete de trial terminando
      (janela de 30h antes de `trialEndsAt`, marca `trialEndingNotifiedAt`
      para nunca reenviar) e rebaixa para `FREE`/`EXPIRED` assinaturas
      `PAST_DUE` há mais de `PAST_DUE_GRACE_PERIOD_DAYS` (3 dias — dá tempo
      do cliente pagar Pix/Boleto manualmente). Rede de segurança adicional:
      também rebaixa trials que passaram do `trialEndsAt` há mais de 3 dias
      sem nunca terem recebido webhook de confirmação/atraso (falha de
      entrega da Asaas).
      Novas colunas em `tb_subscriptions`: `trial_ending_notified_at`,
      `past_due_since` (migration
      `1786400000000-AddLifecycleTrackingToSubscriptions`).
- [x] Novos templates de e-mail no módulo `mails` (Brevo): "Seu trial do
      Vaulto Pro termina amanhã" (via job), "Seu Vaulto Pro começou!"
      (`HandleAsaasWebhookUseCase`, ao confirmar pagamento vindo de
      `TRIALING`/`PAST_DUE` — não reenvia em toda renovação já `ACTIVE`),
      "Pagamento não identificado" (`HandleAsaasWebhookUseCase`, ao entrar em
      `PAYMENT_OVERDUE` — não reenvia em webhooks repetidos do mesmo atraso).
- [x] Downgrade automático para `FREE` já cobre: cancelamento/inativação da
      assinatura na Asaas (existia desde a Fase 1), `PAYMENT_DELETED`/
      `PAYMENT_REFUNDED` (existia desde a Fase 1), e agora também `PAST_DUE`
      prolongado e trial nunca confirmado (novo, via
      `RunSubscriptionLifecycleUseCase`) — reaplicando os limites da Fase 0
      automaticamente, já que a query `mySubscription` sempre reflete o
      estado atual.

### Fase 4 — Funcionalidades premium (ordem de prioridade sugerida)

**Status:** Em andamento (7 de 9 concluídos — Previsão financeira,
Calendário financeiro, Lembretes, Metas financeiras, Comparativos,
Exportação PDF/Excel e Saúde financeira)
**Repositório:** `backend-vaulto` + `frontend-vaulto`

Ordem recomendada (da conversa original, mantém o Pro "irresistível" sem
depender só de remover limites):

1. [x] **Previsão financeira / "Quanto posso gastar?"** — saldo atual +
       entradas previstas − saídas previstas (dívidas em aberto + faturas de
       cartão + metas) = valor sugerido de gasto seguro no período. Feature-chave
       sugerida como carro-chefe do Pro. Concluído (branch
       `feat/phase-4.1-financial-forecast` em ambos os repositórios, a partir
       de `project/vaulto-saas`) — backend: módulo `reports`
       (`GetFinancialForecastUseCase`); frontend: página `/previsao`.
2. [x] **Calendário financeiro** — visão mensal com entradas/saídas por dia
       (dívidas, receitas, faturas) nos próximos 30 dias. Concluído (branch
       `feat/phase-4.2-financial-calendar`, só `frontend-vaulto` — reaproveita
       as queries já existentes de dívidas/receitas/faturas, sem módulo novo
       no backend) — página `/calendario`.
3. [x] **Lembretes** — notificação (e-mail via Brevo, e futuramente
       push/in-app) de vencimento de parcela, fatura de cartão ou receita
       esperada. Concluído (branch `feat/phase-4.3-reminders` em ambos os
       repositórios) — backend: módulo `reminders`; frontend: página
       `/lembretes` e seção colapsável de conta na sidebar.
4. [x] **Metas financeiras** — valor-alvo, valor guardado, progresso e
       estimativa de tempo para atingir a meta. Concluído (branch
       `feat/phase-4.4-financial-goals` em ambos os repositórios, a partir de
       `project/vaulto-saas`) — recurso exclusivo do plano Pro. Backend:
       módulo `goals` (CRUD de metas + registrar/editar/excluir
       contribuições, com recálculo automático de `currentAmount` e
       progresso). Frontend: página `/metas` (listagem com valor alvo, valor
       atual, valor restante e progresso) e página separada
       `/metas/contribuicoes` (seleciona a meta, registra/edita/exclui
       contribuições e mostra o histórico abaixo — mesmo modelo das telas de
       Pagamentos/Recebimentos).
5. [x] **Comparativos** — mês a mês e por categoria (ex.: "Alimentação -18%
       em relação ao mês anterior"). Concluído (branch
       `feat/phase-4.5-comparisons` em ambos os repositórios, a partir de
       `project/vaulto-saas`) — recurso exclusivo do plano Pro. Backend:
       query `getCategoryComparison` no módulo `reports`, comparando
       despesas e receitas por categoria entre dois períodos (valor atual,
       valor anterior, variação e % de variação); suporta granularidade
       mensal, trimestral, semestral ou anual (`periodType`), com os blocos
       alinhados ao calendário (Q1-Q4, S1-S2), e permite informar
       `comparisonDate` explícito em vez de assumir sempre o período
       anterior. Frontend: página `/comparativos` com seletor de período
       (Mês/Trimestre/Semestre/Ano), modo automático (compara com o
       período anterior) ou customizado (escolhe os dois períodos
       livremente), e ação explícita ("Comparar") em vez de buscar a cada
       troca de campo.
6. [ ] **Importação de extrato (CSV/OFX)** — parser + reconciliação
       automática por categoria (heurística simples primeiro, sem IA).
7. [ ] **Vaulto Insights (IA)** — respostas em linguagem natural sobre os
       próprios dados do usuário ("onde estou gastando mais?"). Não implementar
       só "porque está na moda" — só depois que os dados estruturados acima
       (previsão, comparativos) já existirem, pois a IA vai se apoiar neles.
8. [x] **Exportação (PDF/Excel)** — reaproveitar o módulo `pdf-generator`
       já existente, criando um novo template de "Relatório Financeiro" (hoje só
       existem templates de orçamento/contrato). Concluído (branch
       `feat/phase-4.8-exports` em ambos os repositórios, a partir de
       `project/vaulto-saas`) — recurso exclusivo do plano Pro. Backend: o
       `pdf-generator` foi reconstruído do zero (os templates de
       orçamento/contrato eram resquício de outro produto, sem uso real) em
       torno de um motor tabular genérico único (`RenderTabularReportTemplateService`)
       com a identidade visual do Vaulto; novo módulo `excel-generator`
       (exceljs) espelhando o mesmo payload genérico; novo módulo `exports`
       com um builder por recurso (Dívidas, Pagamentos, Receitas,
       Recebimentos, Cartões, Categorias, Extrato, Metas, Contribuições),
       cada um reaproveitando o repositório do módulo dono (sem duplicar
       regra de negócio) e respeitando os mesmos filtros de status/tipo/
       categoria aplicados na tela; gate de Pro via
       `PlanLimitsService.assertProPlan`; query GraphQL `exportResource`
       retornando `{ filename, mimeType, base64 }`. Frontend: BFF
       (`/api/exports/<recurso>`) traduzindo REST → GraphQL → download
       binário; componente `ExportButtons` (PDF/Excel, loading, toast de
       sucesso/erro, CTA de upgrade quando Free) integrado nas 9 telas
       correspondentes.
9. [x] **Saúde financeira (score)** — indicador 0–100 combinando
       comprometimento com dívidas, gastos, reservas — depende dos itens acima
       já existirem para ter dados suficientes. Concluído (branch
       `feat/phase-4.9-financial-health-score` em ambos os repositórios, a
       partir de `project/vaulto-saas`) — recurso exclusivo do plano Pro.
       Backend: dentro do módulo `reports` já existente, função pura de
       domínio `computeFinancialHealthScore` combinando 3 pilares —
       comprometimento com dívidas (peso 50%, razão entre dívidas e receitas
       em aberto no período), pontualidade (peso 30%, proporção de dívidas
       sem atraso) e reservas (peso 20%, progresso médio das metas
       financeiras via `computeGoalProgress`, com o peso redistribuído entre
       os outros dois pilares quando o usuário não tem metas cadastradas);
       reaproveita `getDebtsReport`/`getIncomesReport` e o repositório de
       metas (mesmo padrão de import cross-módulo do `exports`); query
       GraphQL `getFinancialHealthScore` com período configurável (mesma
       janela de 30 dias da Previsão, por padrão). Frontend: página
       `/saude-financeira` com o mesmo seletor de período da Previsão
       (7/15/30/60/90 dias ou data específica), score em destaque colorido
       por faixa (saudável/atenção/crítico) e os 3 pilares detalhados
       abaixo, com CTA contextual para criar uma meta quando o pilar de
       reservas ainda não tem dados.

### Fase 5 — Migração de infraestrutura para uso comercial

**Status:** Não iniciado
**Repositório:** infraestrutura (Vercel/Neon/Upstash/Brevo)

**Não fazer isso antes de ter o primeiro plano pago pronto para cobrar.**
Continuar em todos os planos Free durante o desenvolvimento e beta (respeitando
os limites de uso pessoal/não comercial do Vercel Hobby).

- [ ] No dia em que a primeira cobrança real for ativada: migrar o projeto na
      Vercel de Hobby para **Pro (~US$ 20/mês)** — obrigatório contratualmente
      para uso comercial, e também desabilita o uso de dados por padrão para
      treinamento de IA (relevante por guardarmos dados financeiros).
- [ ] Neon, Upstash e Brevo **podem continuar Free** nesse momento — a
      restrição de uso comercial encontrada foi específica do Vercel Hobby.
- [ ] Reavaliar mais adiante (não agora) se compensa migrar para Cloudflare
      (Workers/Pages, US$ 0 → US$ 5/mês) em vez de Vercel Pro. Ressalva
      importante: o backend é NestJS e o Workers roda em runtime
      serverless/edge diferente do Node tradicional — exigiria um teste de
      compatibilidade antes de migrar, não é uma troca direta.

### Fase 6 — Expansão futura (após validar o Pro)

**Status:** Não iniciado

- [ ] **Vaulto Family** (R$ 24,90–29,90/mês): assinatura compartilhada entre
      duas ou mais contas (ex.: casal), visualizando receitas/despesas/
      dívidas/cartões/metas/orçamento em conjunto. Tecnicamente exige um
      conceito nível "household"/grupo familiar acima do usuário individual —
      é a primeira vez que o modelo de dados precisaria de algo parecido com
      multi-tenant; hoje tudo é 1:1 por `idUsers`.
- [ ] **Vaulto AI** (R$ 24,90/mês, upsell separado do Pro): camada de IA mais
      avançada sobre o Vaulto Insights da Fase 4.

## 4. Observações técnicas transversais

- Seguir sempre o padrão de camadas do projeto (`domain/application/
infrastructure/presentation`) e o padrão de mutation + webhook já usado em
  `mustChangePassword`/`onboardingTourCompleted` como referência de "flag de
  estado do usuário exposta na sessão".
- Nunca confiar no frontend para liberar o plano Pro — sempre via webhook do
  gateway confirmado no backend (mesma lógica de "não confiar no cliente" já
  aplicada em outras partes do sistema, como o `FirstAccessGuard`).
- Todo novo texto de erro de limite de plano deve entrar no catálogo
  `APP_ERRORS` existente, não como string solta.
- Seguir o padrão de commits/branches já estabelecido: uma branch por fase (ou
  por sub-entrega dentro da fase), a partir da `master` atualizada, sem
  commit/push automático — sempre aguardar confirmação explícita antes de
  enviar para o remoto.

## 5. Aspectos fiscais e legais (não é aconselhamento jurídico/contábil)

- Licenciamento de uso de software (SaaS) no Simples Nacional pode cair no
  Anexo III ou V dependendo do Fator R — a alíquota efetiva varia com o
  faturamento acumulado dos últimos 12 meses. Não assumir uma alíquota fixa
  (ex.: 6%) como definitiva; validar com contador antes de precificar
  considerando carga tributária real.
- Confirmar com um contador o enquadramento antes de emitir a primeira nota
  fiscal de assinatura.

## 6. Métricas para acompanhar a partir do lançamento pago

- MRR (receita recorrente mensal) e ARR.
- Taxa de conversão Free → Pro (cenários de referência da análise: 5% = OK,
  10% = ótimo, 15%+ = excelente; abaixo de 5% sugere rever preço/percepção de
  valor).
- Churn mensal.
- CAC/LTV, quando houver aquisição paga.
- Quantos usuários chegam ao limite do Free sem nunca iniciar o trial (sinal
  de preço/valor percebido, não de falta de necessidade).

## 7. Como retomar este trabalho em uma sessão futura

1. Leia este documento inteiro antes de escrever qualquer código.
2. Rode `git log --oneline -20` em `backend-vaulto` e `frontend-vaulto` para
   confirmar o que já foi implementado desde a última atualização deste
   arquivo (o código sempre manda mais que este documento se divergirem).
3. Encontre a primeira fase da seção 3 com `Status: Não iniciado` ou
   `Em andamento` e continue a partir dela — as fases têm dependência
   sequencial (ex.: Fase 2 depende da query `mySubscription` da Fase 0).
4. Ao concluir itens, marque o checkbox e atualize o `Status` da fase.
5. Nunca pule a Fase 5 (migração de infraestrutura) para antes do momento em
   que cobranças reais vão começar — antes disso, tudo deve continuar nos
   planos gratuitos.
