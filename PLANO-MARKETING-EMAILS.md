# Plano: Aba de E-mails de Marketing/Parcerias no Admin

Branch planejada: `feat/marketing-emails` (backend-vaulto e frontend-vaulto),
criada a partir de `master` local atualizada com `origin/master`. **Nenhum
commit ou push será feito** — implementação fica só no working tree local
para o usuário testar.

## 1. Objetivo

Dar ao time interno (grupo `ADMIN_MASTER`) uma aba dentro do Admin para
disparar e-mails de prospecção de parceiros/influencers (o texto de proposta
de parceria do Vaulto), com:

- categoria do envio;
- bloqueio de reenvio para o mesmo destinatário em menos de 7 dias corridos;
- caixa de texto pré-preenchida com o texto padrão (editável antes de
  enviar);
- preview em tempo real do e-mail final;
- histórico de envios (destinatário, nome, celular, categoria, data/hora,
  quem enviou).

Fora de escopo nesta fase (não implementar sem aprovação explícita): disparo
em massa/lista importada, agendamento para data futura, tracking de
abertura/clique. Ver seção 8 para itens que **podem** ser adicionados se o
usuário aprovar.

## 2. Por que seguir o módulo `support` como referência

O módulo `src/modules/support` já resolve o mesmo formato de problema:
registro de um evento enviado por um usuário, checagem de "já enviou dentro
da janela X" (`hasMessageSince`), listagem paginada admin com filtro de
categoria, e um resolver admin separado (`SupportAdminResolver`) protegido
por `@RequirePageAccess(PageAccessKey.ADMIN)` + `@RequirePermissions(...)`.
O módulo `referrals` (`SendReferralInviteUseCase` + tabela
`tb_referral_invites`) já resolve especificamente "não deixar reenviar pro
mesmo e-mail" com unique index como rede de segurança na camada de dados.
O novo módulo `marketing-emails` combina os dois padrões.

## 3. Backend (NestJS, arquitetura hexagonal)

### 3.1 Novo módulo `src/modules/marketing-emails/`

```
domain/
  enums/marketing-email-category.enum.ts
  constants/marketing-email-category-labels.constant.ts
application/
  ports/marketing-email-repository.port.ts
  dto/send-marketing-email.command.ts
  dto/list-marketing-email-sends.query.ts
  use-cases/send-marketing-email.use-case.ts
  use-cases/list-marketing-email-sends.use-case.ts
  use-cases/get-marketing-email-recipient-cooldown.use-case.ts
  use-cases/preview-marketing-email.use-case.ts
  use-cases/get-marketing-email-default-template.use-case.ts
infrastructure/
  persistence/typeorm/entities/marketing-email-send.entity.ts
  persistence/typeorm/repositories/marketing-email-send-typeorm.repository.ts
presentation/
  graphql/resolvers/marketing-email.resolver.ts
  graphql/dtos/*.dto.ts
  graphql/enums/marketing-email-graphql.enums.ts
  templates/partner-outreach-email.template.ts
  templates/marketing-markdown-renderer.ts
marketing-emails.module.ts
```

### 3.2 Modelo de dados

Migration `CreateMarketingEmailSends` (nome de arquivo seguindo o padrão
`178XXXXXXXXXX-CreateMarketingEmailSends.ts`), tabela
`tb_marketing_email_sends`:

| coluna | tipo | obs |
|---|---|---|
| `idtb_marketing_email_sends` | uuid, PK | `uuid_generate_v4()` |
| `category` | varchar | enum `MarketingEmailCategory` |
| `recipient_email` | varchar | normalizado (trim + lowercase) |
| `recipient_name` | varchar | obrigatório |
| `recipient_phone` | varchar, nullable | opcional, sem máscara fixa |
| `subject` | varchar | assunto efetivamente enviado |
| `body_markdown` | text | corpo (markdown) efetivamente enviado — guarda
o texto real editado pelo admin, não só o padrão, pra auditoria/reabertura |
| `sent_by_admin_id` | uuid | FK lógica pra `tb_users` (mesmo padrão de
`repliedByAdminId` em support, sem FK física) |
| `created_at` | timestamptz | `now()` |

Índice: `(recipient_email, created_at)` — usado tanto pela checagem dos 7
dias quanto por uma eventual busca no histórico por e-mail.

### 3.3 Regra dos 7 dias corridos

Em `SendMarketingEmailUseCase`, mesmo espírito do
`SendSupportMessageUseCase`/`SendReferralInviteUseCase`:

1. Normaliza o e-mail (`trim().toLowerCase()`).
2. Busca o envio mais recente pra aquele e-mail
   (`findMostRecentSendForEmail`, equivalente ao `hasMessageSince`, mas
   retornando a data pra poder informar "disponível novamente em X").
3. Se existir envio com `created_at >= now() - 7 dias`, lança
   `AppException.from(APP_ERRORS.marketingEmails.recipientCooldownActive, ...)`
   (HTTP 409, mesma classe de erro do `support.dailyLimitReached`) —
   **a checagem é global**, não por categoria (reenviar pra mesma pessoa em
   categoria diferente dentro de 7 dias também é bloqueado, evitando spam
   pro mesmo contato).
4. Só grava o registro no histórico **depois** do provedor de e-mail
   confirmar o envio (mesmo motivo do comentário em
   `send-referral-invite.use-case.ts`: falha transitória no provedor não
   pode travar permanentemente um retry).

Além da checagem na hora de enviar, uma query separada
`marketingEmailRecipientCooldown(email)` deixa o frontend avisar o admin
*antes* de ele preencher o formulário inteiro (mesmo padrão do
`mySupportMessageStatus`).

### 3.4 Categorias propostas (a validar com o usuário)

```ts
enum MarketingEmailCategory {
  INFLUENCER = "INFLUENCER",           // Influenciador / Criador de Conteúdo
  BUSINESS_PARTNER = "BUSINESS_PARTNER", // Parceiro Comercial
  PRESS = "PRESS",                      // Imprensa / Mídia
  OTHER = "OTHER",                      // Outro
}
```

Extensível — se o usuário já tiver uma lista de categorias em mente, ajusto
antes de implementar.

### 3.5 Template de e-mail e preview

O texto padrão fornecido usa uma sintaxe markdown-like (`##`, `**`, listas,
tabela em pipe, links). Para não duplicar renderização entre backend e
frontend (e garantir que o preview seja **pixel-a-pixel** igual ao e-mail
real), a estratégia é:

- Backend adiciona a dependência `marked` (parser markdown leve, sem
  dependências, ~30kb) e customiza o `renderer` dele pra gerar HTML já com
  os estilos inline da marca Vaulto (mesmas cores de
  `presentation/templates/layout/email-brand.ts`): títulos `##` viram
  `<h2>` com a cor de destaque, `**negrito**` mantém `<strong>`, tabelas
  markdown (`| col | col |`) viram `<table>` HTML com bordas e cabeçalho
  estilizados — **a tabela de preços fica como tabela HTML nativa, não como
  imagem** (mais robusta em clientes de e-mail, sem precisar hospedar
  arquivo, editável se os valores mudarem). Se depois quiser trocar por
  imagem é só substituir o bloco de tabela do texto por um `![alt](url)`.
- O HTML gerado pelo `marked` passa por `sanitize-html` antes de virar corpo
  do e-mail (nova dependência, ~200kb) — o admin cola/edita texto livre, e
  isso evita que uma tag quebrada colada sem querer estoure o layout do
  e-mail.
- `partner-outreach-email.template.ts` recebe `{ subject, bodyMarkdown }`,
  roda o texto pelo renderer e injeta o HTML resultante como `contentHtml`
  de `renderStandardEmailLayout` (o mesmo layout com cabeçalho
  "VAULTO"/rodapé usado em todos os outros e-mails transacionais) —
  garante que o e-mail sai com a cara do produto, não uma peça solta.
- Query GraphQL `previewMarketingEmail(input: { subject, bodyMarkdown })`
  roda exatamente esse mesmo pipeline e devolve o HTML final. O frontend
  não reimplementa nenhuma regra de renderização — só manda o texto digitado
  (debounced ~400ms) e mostra o HTML retornado dentro de um `<iframe
  srcDoc=...>`. Isso também é o que garante o "preview em tempo real"
  pedido, sem duplicar lógica de markdown em TypeScript de frontend.
- Query `marketingEmailDefaultTemplate` devolve `{ subject, bodyMarkdown }`
  fixos (constante no backend, com o texto que você enviou) — o frontend
  carrega isso ao abrir a aba pra pré-preencher a caixa de texto. Fica *uma*
  fonte de verdade pro texto padrão (backend), em vez de colar o texto
  gigante duas vezes.
- Placeholders `[INSERIR LINK DO APP]` / `[INSERIR LINK DO INSTAGRAM]`
  ficam no texto padrão como estão — o app não tem hoje um link de
  Instagram configurado em nenhum lugar do código (só há botão de
  compartilhar no app do usuário final), então não dá pra auto-preencher
  com segurança; o admin troca manualmente antes de enviar (o link do App
  em si eu já posso pré-substituir usando `FRONTEND_URL`, se preferir).

### 3.6 Permissões / acesso

Segue o mesmo modelo de `READ_ADMIN_DASHBOARD` (restrito a
`ADMIN_MASTER`, dado o caráter sensível — enviar e-mail em nome da empresa
pra terceiros):

- Novas permissões em `AuthPermission`: `READ_MARKETING_EMAILS`,
  `MANAGE_MARKETING_EMAILS`.
- Adicionadas só em `GROUP_PERMISSIONS[UserGroup.ADMIN_MASTER]`.
- Resolver com `@RequirePageAccess(PageAccessKey.ADMIN)` (mesma page-access
  key do restante do admin — não cria página nova, é uma aba dentro da
  existente) + `@RequirePermissions(...)` por query/mutation, igual
  `AdminResolver`/`SupportAdminResolver`.

### 3.7 GraphQL (novo, adicionado ao schema)

```graphql
enum MarketingEmailCategory { INFLUENCER BUSINESS_PARTNER PRESS OTHER }

type MarketingEmailDefaultTemplateDto { subject: String! bodyMarkdown: String! }
type MarketingEmailPreviewDto { html: String! }
type MarketingEmailCooldownDto { blocked: Boolean! nextAllowedAt: DateTime }
type MarketingEmailSendDto {
  idMarketingEmailSend: ID!
  category: MarketingEmailCategory!
  recipientEmail: String!
  recipientName: String!
  recipientPhone: String
  subject: String!
  sentByAdminName: String!
  createdAt: DateTime!
}
type MarketingEmailSendsResponseDto {
  items: [MarketingEmailSendDto!]!
  total: Int! currentPage: Int! limit: Int! totalPages: Int! hasNextPage: Boolean!
}

input PreviewMarketingEmailInputDto { subject: String! bodyMarkdown: String! }
input SendMarketingEmailInputDto {
  category: MarketingEmailCategory!
  recipientEmail: String!
  recipientName: String!
  recipientPhone: String
  subject: String!
  bodyMarkdown: String!
}
input ListMarketingEmailSendsInputDto {
  page: Int limit: Int category: MarketingEmailCategory recipientEmail: String
}

type Query {
  marketingEmailDefaultTemplate: MarketingEmailDefaultTemplateDto!
  previewMarketingEmail(input: PreviewMarketingEmailInputDto!): MarketingEmailPreviewDto!
  marketingEmailRecipientCooldown(email: String!): MarketingEmailCooldownDto!
  listMarketingEmailSends(input: ListMarketingEmailSendsInputDto): MarketingEmailSendsResponseDto!
}
type Mutation {
  sendMarketingEmail(input: SendMarketingEmailInputDto!): MarketingEmailSendDto!
}
```

### 3.8 Catálogos existentes a estender

- `APP_ERRORS.marketingEmails`: `recipientCooldownActive` (409),
  `subjectRequired` (400), `bodyRequired` (400), `sendFailed` (502).
- `RESPONSE_MESSAGES.marketingEmails`: `sent`, `listed`.

## 4. Frontend (React + camada BFF em `server/`)

O frontend não fala GraphQL direto — passa por um BFF Express
(`frontend-vaulto/server`) que expõe REST e reenvia GraphQL pro backend
(mesmo padrão de `server/src/modules/support` e `.../admin`).

### 4.1 Novo módulo BFF: `server/src/modules/marketing-emails/`

- `queries.js` — as 5 operações GraphQL da seção 3.7.
- `service.js` — `getDefaultTemplate`, `previewMarketingEmail`,
  `getRecipientCooldown`, `listMarketingEmailSends`, `sendMarketingEmail`
  (mesmo formato de `executeGraphql` + `requireData` usado em
  `support/service.js`).
- `routes.js`:
  - `GET /admin/marketing-emails/default-template`
  - `POST /admin/marketing-emails/preview`
  - `GET /admin/marketing-emails/cooldown?email=`
  - `GET /admin/marketing-emails/sends` (paginado + filtros)
  - `POST /admin/marketing-emails/send`
- Registrado em `server/src/routes.js` como
  `router.use("/admin/marketing-emails", marketingEmailsRoutes)`.

### 4.2 Camada `src/api/marketing-emails/`

- `schema.ts` (zod, mesmo padrão de `src/api/support/schema.ts`).
- `methods/*.ts` — um arquivo por chamada HTTP, usando `apiHttp` (mesmo
  `getApiErrorMessage` de tratamento de erro do resto do app).

### 4.3 Camada `src/features/marketing-emails/`

- `services/marketing-emails.service.ts` — funções `fetchX`/`requestX` que
  chamam `api/marketing-emails` e validam com os schemas zod (mesmo formato
  de `features/support/services/support.service.ts`).
- `index.ts` reexportando o necessário pras páginas.

### 4.4 UI — nova aba `AdminMarketingEmailsTab.tsx`

Adicionada em `AdminDashboard.tsx` (`TABS` + `AdminTab` union +
`isAdminTab`), ícone `Mail` do lucide-react, label "E-mails de Parceria".

Estrutura da aba (layout em duas colunas dentro de um `SectionCard`, igual
ao restante do admin):

**Coluna esquerda — formulário de envio**
- `Select` de categoria (`atoms/Select`).
- `Input` nome do destinatário, `Input` e-mail do destinatário, `Input`
  celular (opcional, sem obrigatoriedade, como pedido).
- Checagem de cooldown: ao sair do campo e-mail (`onBlur`), chama
  `marketingEmailRecipientCooldown` e mostra um aviso inline
  (`SupportCooldownNotice`-like, reaproveitando o componente existente ou
  um novo `MarketingEmailCooldownNotice` no mesmo padrão) tipo "Já enviamos
  um e-mail pra esse contato em 20/08/2026. Só será possível reenviar a
  partir de 27/08/2026." — não bloqueia digitar, só avisa antes do envio
  falhar no backend (que é a fonte de verdade).
- `Input` assunto (prée-preenchido pelo `marketingEmailDefaultTemplate`,
  editável).
- `Textarea` grande pro corpo (também pré-preenchida, editável) — sem
  editor rich-text; é o mesmo texto markdown-like que o backend já sabe
  renderizar.
- Botão "Enviar" (`atoms/Button`), desabilitado durante `isSending` ou
  quando o cooldown indicar bloqueio.
- Toast de sucesso/erro via `useToast` (mesmo hook usado em `Support.tsx`).

**Coluna direita — preview em tempo real**
- `<iframe>` com `srcDoc` recebendo o HTML de `previewMarketingEmail`,
  atualizado com debounce (~400ms) toda vez que assunto ou corpo mudam.
  Escala/${'largura'} fixa em ~620px (mesma largura do layout de e-mail) pra
  já mostrar como fica no cliente de e-mail real.

**Abaixo — histórico**
- `DataTable` (mesmo componente de `AdminSupportTicketsTab`) com colunas:
  destinatário (nome + e-mail), celular, categoria, assunto, enviado em,
  enviado por.
- Filtro por categoria (`Select`) acima da tabela, mesmo padrão do filtro de
  status em `AdminSupportTicketsTab`.

## 5. Passos de implementação

1. Criar `feat/marketing-emails` a partir de `master` local (após
   `git fetch origin` e conferir que `master` local == `origin/master`) —
   nos dois repositórios (`backend-vaulto`, `frontend-vaulto`).
2. Backend: migration → entidade/repositório → enums/constantes → template
   de e-mail (+ deps `marked`/`sanitize-html`) → use-cases → DTOs GraphQL →
   resolver → módulo → registrar em `app.module.ts` → permissões/página →
   catálogos de erro/mensagem → testes unitários dos use-cases (padrão
   `__tests__` já usado em `support`/`admin`) → `npm run build` +
   `graphql:generate` (o `schema.gql` que já aparece modificado no seu
   working tree hoje é gerado automaticamente nesse passo).
3. Frontend: módulo BFF (`server/`) → camada `api/` → camada `features/` →
   componente da aba → integração no `AdminDashboard.tsx` → teste manual no
   navegador (rodar backend + BFF + frontend local, logar como
   `ADMIN_MASTER`, mandar um e-mail de teste pra uma caixa real via Brevo
   sandbox/produção conforme sua config de `.env`).
4. Nenhum commit/push — só working tree, conforme pedido.

## 6. Reaproveitamento de código existente

- Layout/cores do e-mail: `standard-email-layout.template.ts` +
  `email-brand.ts` (sem mudanças).
- Provedor de envio: `MailProviderPort`/`BrevoMailProvider` (sem mudanças,
  só mais um chamador).
- Paginação: `resolvePagination`/`calculateTotalPages`/
  `calculateHasNextPage` (`common/responses/helpers/pagination.helper.ts`).
- Erros: `AppException` + `APP_ERRORS` catalog.
- Auth: `AuthorizationService.assertPermissionForUserId`,
  `RequirePermissions`, `RequirePageAccess`, `CurrentUser`.
- Frontend: `DataTable`, `SectionCard`, `Select`/`Input`/`Textarea`/`Button`
  atoms, `useToast`, `apiHttp`.

## 7. Riscos / pontos de atenção

- **`sanitize-html`/`marked` são dependências novas** — peso pequeno, mas
  ainda assim uma adição ao `package.json`; posso implementar um
  mini-renderer manual (sem lib) se preferir zero dependências novas, só
  cobrindo a sintaxe do texto padrão (`##`, `**`, listas, tabela, link) —
  fica mais frágil pra texto livre arbitrário que o admin venha a digitar
  no futuro, mas evita a dependência. **Preciso da sua confirmação sobre
  qual caminho seguir.**
- A checagem de 7 dias é **global por e-mail**, não por categoria — se
  quiser permitir reenvio pra mesma pessoa em categoria diferente antes dos
  7 dias, é uma linha diferente na query (fácil de ajustar, só quero
  confirmar antes).
- Histórico guarda o corpo efetivamente enviado (`body_markdown`) por
  envio — cresce a tabela um pouco mais rápido que um histórico só de
  metadados, mas permite auditoria completa e reabrir um envio anterior
  como rascunho. Se preferir não guardar o corpo (só metadados), é só
  remover a coluna.

## 8. Decisões confirmadas (2026-08-22)

- **Renderização**: `marked` + `sanitize-html` (seção 3.5/7), confirmado.
- **Categorias**: as 4 propostas na seção 3.4, confirmado.
- **Extras aprovados para esta rodada** (deixam de ser "ideia" e entram no
  escopo de implementação):
  1. **Bloquear o botão "Enviar"** (não só avisar) enquanto o e-mail
     digitado estiver em cooldown — o botão fica desabilitado e mostra o
     motivo até o admin trocar o destinatário ou o prazo passar.
  2. **Máscara de telefone BR** no campo celular opcional (formata
     `(11) 91234-5678` enquanto digita; segue opcional, sem validação
     bloqueante já que não é obrigatório).
  3. **Exportar histórico em Excel (XLSX)**, reaproveitando
     `RenderTabularWorkbookService` do módulo `excel-generator` **direto**
     (não o pipeline `ExportResourceUseCase` de `src/modules/exports`, que é
     gated por `PlanLimitsService.assertProPlan` — regra de plano Pro de
     usuário final, sem sentido pra um recurso interno do admin). Nova
     query `exportMarketingEmailSends(input: ListMarketingEmailSendsInputDto)`
     monta o `TabularReportPayload` a partir do histórico filtrado e chama
     `RenderTabularWorkbookService.render(...)`, devolvendo
     `{ filename, mimeType, base64 }` no mesmo formato de
     `ExportResourceResponseDto`. Frontend reaproveita
     `downloadBase64File` (já existe em `src/utils/file.ts`) — botão
     "Exportar" acima da tabela de histórico.
- **Não entram nesta rodada**: campo de link/código de referência por envio
  e duplicar envio anterior como rascunho (itens 2 e 3 da lista original) —
  ficam registrados como ideia futura, não implementados agora.

## 9. Status: implementado (2026-08-22)

Branch `feat/marketing-emails` criada a partir de `master` local nos dois
repositórios. Implementação completa conforme o plano + decisões da seção 8.
Nenhum commit/push foi feito — tudo está no working tree local para você
testar.

**Backend** — módulo `src/modules/marketing-emails/` completo (entidade +
migration `1788100000000-CreateMarketingEmailSends`, repositório, 6
use-cases, resolver GraphQL com 5 queries + 1 mutation, template de e-mail
markdown→HTML com `marked` + `sanitize-html`), permissões novas
(`READ_MARKETING_EMAILS`/`MANAGE_MARKETING_EMAILS`, só `ADMIN_MASTER`),
exportação XLSX reaproveitando `RenderTabularWorkbookService` direto.
Validado: `tsc --noEmit` limpo, `eslint` limpo, `npm run build` ok, suíte
completa (139 suites / 513 testes, incluindo 9 novos testes do cooldown de 7
dias e do renderer) passando, app subindo de ponta a ponta contra o banco de
dev (`npm run migration:run:dev` aplicado com sucesso, schema GraphQL
regenerado com todos os tipos novos).

**Frontend** — nova aba "E-mails de Parceria" em `AdminDashboard.tsx`
(`AdminMarketingEmailsTab.tsx`), camada BFF (`server/src/modules/marketing-emails`),
camada `api/` + `features/` seguindo o padrão de `support`. Validado:
`tsc --noEmit` limpo, `eslint` limpo, `vite build` ok.

**Pegadinha encontrada e corrigida**: `sanitize-html@2.17.2+` passou a
depender de `htmlparser2@10+`, que é ESM-only — quebra o Jest (que roda em
CommonJS) mesmo funcionando normalmente em runtime (Node 24 tem
`require(esm)` nativo, mas o test runner do Jest não passa por esse caminho).
Fixado em `sanitize-html@2.17.1` (última versão que ainda depende de
`htmlparser2@^8`, CJS) — **sem `^` no `package.json`**, de propósito, pra não
voltar a puxar a versão quebrada num `npm install` futuro.

## 10. Próximo passo

Testar localmente (rodar `npm run migration:run:dev` já foi feito no banco
de dev durante a validação — conferir se é o mesmo banco que você usa
localmente; caso use um banco próprio, rodar a migration lá também) e
validar o fluxo completo: carregar a aba, editar o texto, ver o preview
atualizar, tentar enviar duas vezes pro mesmo e-mail (deve bloquear),
exportar o histórico em Excel.
