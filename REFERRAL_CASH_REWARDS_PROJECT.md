# Projeto: Indicações em dinheiro + desconto de primeira mensalidade

Branch pai: `project/referral-cash-rewards` (backend-vaulto e frontend-vaulto).
Cada item abaixo é uma branch filha criada a partir da pai, mergeada de volta
nela no GitHub remoto conforme aprovado. Ao final, a pai é mergeada na master.

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
  Asaas (`POST /v3/transfers`) — sem aprovação manual.
- Usuário recebe o **valor cheio** do saldo sacado; a taxa de transferência
  da Asaas é absorvida pela Vaulto (debitada do saldo Asaas da empresa, não
  do valor que o usuário recebe).
- A qualificação da indicação continua exigindo pagamento real confirmado
  (já era assim antes — `QualifyReferralUseCase` só roda no primeiro
  pagamento confirmado da assinatura do indicado). Isso não muda.
- Desconto de primeira mensalidade: R$19,90 no primeiro mês, R$29,90 a
  partir do segundo. A Asaas não suporta desconto nativo "só no primeiro
  ciclo" em assinaturas recorrentes — a solução é criar a assinatura no
  valor cheio e sobrescrever o valor da primeira cobrança via
  `PUT /v3/payments/{id}` logo após a criação.

## Progresso

- [x] Modelo de dados da carteira de indicações (créditos + saques) e
      reescrita do `QualifyReferralUseCase` pra gerar crédito por indicação
      — **backend**
- [x] Job de promoção `PENDING_HOLD` → `AVAILABLE` + clawback automático via
      webhook de reembolso/estorno — **backend**
- [x] Solicitação de saque automatizada + integração de transferência Pix
      de saída na Asaas + exposição via GraphQL/REST — **backend**
- [x] Tela de carteira de indicações (saldo, histórico, solicitar saque) —
      **frontend**
- [x] Desconto de primeira mensalidade (R$19,90 → R$29,90) — **backend +
      frontend**

Tudo implementado nesta mesma branch pai (`project/referral-cash-rewards`),
sem necessidade de branches filhas separadas dado o quanto as partes são
interdependentes. Testado: 466 testes automatizados passando no backend
(46 novos), typecheck/lint/build limpos nos dois repositórios, e fluxo
completo de saldo → saque → falha/sucesso validado manualmente contra o
banco e a API real (sem chave da Asaas local, então a transferência em si
falha localmente como esperado — validar em produção/sandbox).

## Env vars novas pra configurar na Vercel (todas opcionais, com fallback)

- `PRO_PLAN_PRICE_MONTHLY` = `29.90`
- `PRO_PLAN_PRICE_YEARLY` = `299.90`
- `PRO_PLAN_PRICE_FIRST_MONTH` = `19.90` (padrão já é esse)
- `REFERRAL_CREDIT_AMOUNT_CENTS` = `500` (padrão já é esse)
- `REFERRAL_MIN_WITHDRAWAL_CENTS` = `2000` (padrão já é esse)
- `REFERRAL_CREDIT_HOLD_DAYS` = `7` (padrão já é esse)

## Pendente antes de ir pra produção

- Confirmar que a conta Asaas tem a função de transferência (saque) Pix
  habilitada — é uma permissão de conta, precisa ser checada/habilitada no
  painel da Asaas.
- Setar `PRO_PLAN_PRICE_MONTHLY`/`PRO_PLAN_PRICE_YEARLY` na Vercel com os
  novos valores.
