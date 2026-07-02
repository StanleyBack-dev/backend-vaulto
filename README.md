<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## VAULTO Backend

Backend do projeto VAULTO para gestao financeira pessoal.

Documentos principais:

- Arquitetura e onboarding tecnico: `ARCHITECTURE.md`
- ADR da nova estrutura: `ADR-0001-nova-arquitetura-vaulto.md`
- MVP inicial de dividas: `src/modules/debts`

Comandos de qualidade recomendados antes de PR:

```bash
npm run typecheck
npm run lint:check
npm run test:unit
```

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

## Database Migrations (Production-safe)

Este backend segue estrategia migration-first em producao:

- Em desenvolvimento: `synchronize` pode ficar ativo apenas com `NODE_ENV=development`.
- Em producao: `synchronize` deve permanecer desativado.
- Alteracoes de schema devem ser versionadas em `src/database/migrations`.

Scripts principais:

```bash
# gerar migration no ambiente local
npm run migration:generate:dev

# executar migrations local
npm run migration:run:dev

# executar migrations em producao
npm run migration:run:prod
```

Deploy automatico no GitHub Actions:

- O workflow de deploy (merge em `master`) executa `npm run migration:run:prod` antes do deploy.
- Nao e executado `schema:sync` em producao.

Com isso, o fluxo fica desacoplado do ciclo de build da aplicacao, reproduzivel por ambiente e escalavel para multiplos deploys sem risco de drift de schema.

## Authorization Architecture

O projeto usa autenticacao por JWT em cookie HttpOnly e autorizacao por permissao.

- O token carrega apenas a identidade autenticada e o grupo atual do usuario.
- A decisao de acesso nao fica espalhada em comparacoes manuais por grupo nos modulos.
- Os resolvers declaram capacidades com `RequirePermissions(...)`.
- Os servicos reforcam a mesma regra via `AuthorizationService`, evitando bypass caso um fluxo futuro reutilize o servico.
- O mapeamento central entre grupo e permissoes fica em `src/modules/auth/constants/group-permissions.constant.ts`.

### Sobre seguranca em repositório publico

O fato de o repositorio ser publico nao torna esse modelo vulneravel por si so. Seguranca aqui depende de:

- assinatura e expiracao corretas do JWT
- armazenamento do token em cookie HttpOnly
- validacao server-side das permissoes
- controle de mudanca de grupo e bootstrap administrativo

Como a autorizacao e sempre decidida no servidor, um cliente ver o enum de grupos ou o mapa de permissoes nao concede acesso adicional.

### Quando usar tabela de grupos e permissoes

Uma modelagem com tabelas como `users_groups`, `groups` e `group_permissions` faz sentido quando houver necessidade de:

- criar grupos dinamicamente sem deploy
- delegar administracao de perfis a backoffice
- auditar historico de concessao e revogacao de acesso
- suportar multiplos grupos por usuario

Hoje, com tres grupos fixos e permissoes centralizadas no backend, manter o mapa em codigo e seguro e mais simples. Se o produto passar a exigir administracao dinamica de RBAC, a evolucao natural e mover esse mapeamento para tabelas mantendo a checagem central no `AuthorizationService`.

## Exception Architecture

O projeto agora usa um padrão global de exceptions para evitar mensagens, tipos e formatos espalhados em services, guards, validators e utils.

### Estrutura base

- A exportação agregada do catálogo fica em `src/common/exceptions/app-errors.catalog.ts`.
- Os catálogos por domínio ficam em `src/common/exceptions/catalogs/`.
- A exception reutilizável fica em `src/common/exceptions/app-exception.ts`.
- O contrato tipado dos erros fica em `src/common/exceptions/app-error-definition.type.ts`.
- A padronização da saída GraphQL fica em `src/common/exceptions/graphql-error.formatter.ts`.

### Como criar um novo erro

Adicione o erro dentro do domínio correto no catálogo central.

```ts
export const APP_ERRORS = {
  orders: {
    notFound: {
      code: "ORDERS_NOT_FOUND",
      status: HttpStatus.NOT_FOUND,
      message: "Pedido não encontrado.",
    },
  },
};
```

Se a mensagem precisar de parâmetros dinâmicos, use função:

```ts
invalidStatusTransition: {
  code: "ORDERS_INVALID_STATUS_TRANSITION",
  status: HttpStatus.BAD_REQUEST,
  message: ({ from, to }: { from: string; to: string }) =>
    `Não é possível mudar o status de ${from} para ${to}.`,
}
```

### Como lançar no código

Em vez de lançar `BadRequestException`, `NotFoundException`, `ForbiddenException` ou `Error` diretamente, use:

```ts
throw AppException.from(APP_ERRORS.orders.notFound, undefined);
```

Com parâmetros:

```ts
throw AppException.from(APP_ERRORS.orders.invalidStatusTransition, {
  from: "pending",
  to: "delivered",
});
```

Com detalhes extras:

```ts
throw AppException.from(
  APP_ERRORS.orders.invalidStatusTransition,
  { from: "pending", to: "delivered" },
  { orderId },
);
```

### Regra de uso no projeto

- Novo módulo deve registrar seus erros no catálogo central antes de lançar exceptions.
- Validators devem preferir `AppException.from(...)` em vez de exceptions inline.
- Guards e services devem usar o mesmo catálogo para evitar mensagens divergentes.
- `Error` cru deve ser evitado para fluxos de domínio e validação.

### Saída padronizada no GraphQL

Os erros GraphQL agora saem com shape uniforme em `extensions`:

```json
{
  "errors": [
    {
      "message": "Usuário não encontrado.",
      "extensions": {
        "code": "USERS_NOT_FOUND",
        "statusCode": 404,
        "details": null
      }
    }
  ]
}
```

Isso permite tratar erros no frontend por `code`, sem depender de texto fixo.

### Fluxo recomendado para módulos novos

1. Criar o domínio de erros no `APP_ERRORS`.
2. Usar `AppException.from(...)` em validators, guards e services.
3. Reaproveitar mensagens existentes quando o comportamento for o mesmo.
4. Só criar um novo código quando o erro tiver significado funcional diferente.

### Organização atual

O catálogo já está separado por domínio, por exemplo:

- `src/common/exceptions/catalogs/auth-errors.catalog.ts`
- `src/common/exceptions/catalogs/users-errors.catalog.ts`
- `src/common/exceptions/catalogs/customers-errors.catalog.ts`
- `src/common/exceptions/catalogs/profiles-errors.catalog.ts`

O restante da aplicação continua importando apenas a agregação em `src/common/exceptions/app-errors.catalog.ts`.

## Release Flow

Este repositório usa dois workflows no GitHub Actions:

- `CI`: roda em pull requests para `master` e `beta`.
- `Release`: roda em push para `master` e `beta`.

O backend segue o mesmo padrao do frontend `frontend-royal-copeiras`:

- mesmos gatilhos de pull request e push
- mesma estrutura de workflows
- semantic-release sem arquivo de configuracao customizado no repositório

Como `master` e `beta` estao protegidas e aceitam alteracoes apenas via pull request, o fluxo atual evita commit automatico em arquivos versionados da branch protegida.

Se no futuro for necessario voltar a versionar `package.json` e `CHANGELOG.md`, a estrategia recomendada e usar um fluxo baseado em pull request:

1. gerar a proxima versao em uma branch temporaria de release
2. atualizar os arquivos versionados nessa branch
3. abrir um pull request automatico para `beta` ou `master`
4. deixar o merge dessa PR passar pelos mesmos checks obrigatorios do repositório

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
