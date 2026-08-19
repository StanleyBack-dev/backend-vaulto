# Projeto: Indicações em dinheiro + desconto de primeira mensalidade

Branch pai: `project/referral-cash-rewards` (backend-vaulto e frontend-vaulto),
mergeada continuamente em `beta` (ambiente de preview isolado na Vercel,
com banco Neon próprio) conforme cada parte é testada.

## Decisões tomadas

- **R$5,00** por indicação paga (troca o modelo antigo de "30 dias grátis a
  cada 3 indicados" por crédito em dinheiro por indicação, sem lote).
- **R$20,00** de saldo mínimo acumulado pra poder solicitar saque.
- **7 dias de retenção** (`PENDING_HOLD`) antes do crédito virar `AVAILABLE`,
  cobrindo a janela do direito de arrependimento (CDC art. 49). Se a cobrança
  do indicado for reembolsada/estornada dentro desse prazo, o crédito é
  cancelado (`CLAWED_BACK`) automaticamente via webhook da Asaas.
- Saque é **solicitado pelo usuário** (nunca automático por atingir o
  mínimo) e **processado automaticamente** na hora via transferência Pix da
  Asaas (`POST /v3/transfers`) — sem aprovação manual humana.
- Usuário recebe o **valor cheio** do saldo sacado; a taxa de transferência
  da Asaas é absorvida pela Vaulto (debitada do saldo Asaas da empresa, não
  do valor que o usuário recebe).
- A qualificação da indicação continua exigindo pagamento real confirmado
  (já era assim antes — `QualifyReferralUseCase` só roda no primeiro
  pagamento confirmado da assinatura do indicado). Isso não muda.
- Desconto de primeira mensalidade: R$19,90 no primeiro mês, R$29,90 a
  partir do segundo, via `PUT /v3/payments/{id}` sobrescrevendo só a
  primeira cobrança da assinatura.
- Consulta de titularidade da chave Pix (DICT/Banco Central via Asaas) antes
  de confirmar o saque — mostra banco + titular pro usuário conferir; se a
  consulta falhar, apenas avisa, não bloqueia (a própria transferência real
  rejeita chave inválida de qualquer forma).
- Aprovação automática de transferência Pix: a Asaas trata todo saque como
  "evento crítico" que por padrão exige aprovação manual humana. Resolvido
  com um webhook de aprovação automática (`/webhooks/asaas/transfer-approval`)
  que aprova só transferências que o próprio Vaulto criou (casadas por
  `gatewayTransferId`), sem precisar de IP fixo (o backend roda serverless
  na Vercel, sem IP de saída fixo).
- Status do histórico de saque é sincronizado automaticamente via webhook
  (`TRANSFER_DONE`/`TRANSFER_FAILED`) — antes ficava travado em
  "Processando" mesmo após o Pix liquidar de verdade.

## Progresso

- [x] Modelo de dados da carteira de indicações (créditos + saques) —
      **backend**
- [x] Job de promoção `PENDING_HOLD` → `AVAILABLE` + clawback automático via
      webhook de reembolso/estorno — **backend**
- [x] Solicitação de saque automatizada + transferência Pix de saída na
      Asaas + exposição via GraphQL/REST — **backend**
- [x] Aprovação automática de transferência (webhook de evento crítico) +
      sincronização de status via webhook — **backend**
- [x] Consulta de titularidade da chave Pix (DICT) — **backend + frontend**
- [x] Tela de carteira de indicações (saldo, histórico, solicitar saque),
      com validação/máscara de chave Pix (CPF/CNPJ/telefone/e-mail/EVP) e
      modal de confirmação antes do saque — **frontend**
- [x] Atalho de saldo no sidebar, sincronizado em tempo real após saque —
      **frontend**
- [x] Desconto de primeira mensalidade (R$19,90 → R$29,90) — **backend +
      frontend**
- [x] Re-aceite forçado de Termos de Uso quando a versão muda — **backend +
      frontend**
- [x] Conteúdo de Termos/Privacidade/Manual atualizado — **frontend**
- [x] Ambiente de beta isolado na Vercel: domínios próprios
      (`beta.vaulto.app.br` / `api.beta.vaulto.app.br`), banco Neon próprio
      (branch separada, migrations reconciliadas), sem tocar em produção —
      **infra**
- [x] Correções encontradas testando em beta: crash de boot por env var
      (`NODE_ENV`/`TYPEORM_LOGGING`), URL de backend errada no BFF, proteção
      da Vercel bloqueando chamadas servidor-a-servidor (bypass por header + query param), exibição de horário mostrando UTC em vez de horário
      de Brasília, lista de usuários admin quebrando com usuários de
      indicação sem credenciais — **backend + frontend**

Testado: 480 testes automatizados passando no backend, typecheck/lint/build
limpos nos dois repositórios, e o fluxo completo (indicação → crédito →
saldo → saque → aprovação automática → confirmação de status) validado de
ponta a ponta contra o sandbox real da Asaas em `beta.vaulto.app.br`.

## Env vars (Vercel — já configuradas em Preview/beta; conferir em Production)

- `PRO_PLAN_PRICE_MONTHLY` = `29.90`
- `PRO_PLAN_PRICE_YEARLY` = `299.90`
- `PRO_PLAN_PRICE_FIRST_MONTH` = `19.90` (padrão já é esse)
- `REFERRAL_CREDIT_AMOUNT_CENTS` = `500` (padrão já é esse)
- `REFERRAL_MIN_WITHDRAWAL_CENTS` = `2000` (padrão já é esse)
- `REFERRAL_CREDIT_HOLD_DAYS` = `7` (padrão já é esse)

## Pendente antes de ir pra produção

- [ ] Confirmar em Production (Vercel) que `PRO_PLAN_PRICE_MONTHLY` e
      `PRO_PLAN_PRICE_YEARLY` estão setadas com os novos valores (29.90 /
      299.90) — hoje só confirmamos em beta.
- [ ] Na conta **Asaas de produção** (não a de sandbox): confirmar que a
      permissão de transferência (saque) Pix está habilitada, e configurar
      o webhook de aprovação automática (`/webhooks/asaas/transfer-approval`)
      com o token de produção — hoje só está configurado no sandbox.
- [ ] Merge final de `project/referral-cash-rewards` (ou `beta`) → `master`,
      abrindo o PR pro fluxo normal de CI/CD.
- [ ] Depois do merge, testar uma vez em produção real (fora do sandbox)
      com um valor pequeno de saque de verdade, pra confirmar que a
      aprovação automática + sincronização de status funcionam igual ao
      beta.
