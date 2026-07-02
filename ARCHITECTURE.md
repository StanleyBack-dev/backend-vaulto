# Arquitetura Backend VAULTO

Este documento operacionaliza o ADR `ADR-0001-nova-arquitetura-vaulto.md`.

## Objetivo

Padronizar desenvolvimento por módulos orientados a domínio, com baixo acoplamento e alta testabilidade.

## Estrutura por módulo

Cada novo módulo deve seguir:

- `domain`: entidades, value objects, eventos, contratos de repositório.
- `application`: casos de uso, portas, DTOs de entrada/saída internos.
- `infrastructure`: implementações concretas (TypeORM, serviços externos).
- `presentation`: GraphQL resolvers e DTOs de API.

## Fluxo recomendado para novas features

1. Modelar regra no domínio e escrever testes unitários.
2. Criar caso de uso na aplicação e contratos necessários.
3. Implementar adaptadores na infraestrutura.
4. Expor operação em resolver/controller na apresentação.
5. Cobrir fluxo crítico com teste e2e.

## Regras de dependência

- `domain` não importa framework.
- `application` não importa implementações concretas.
- `presentation` não acessa repositórios diretamente.

## Qualidade obrigatória

- `npm run typecheck`
- `npm run lint:check`
- `npm run test:unit`

## MVP inicial (dívidas)

Escopo inicial:

- Cadastro de dívidas fixas e variáveis.
- Valor, data de início, quantidade de parcelas e status.
- Registro de pagamento (parcial/total).
- Consulta listada por período/situação.

Implementação inicial já disponível em `src/modules/debts`.
