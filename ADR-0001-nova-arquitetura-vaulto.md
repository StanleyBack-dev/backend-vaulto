# ADR-0001 - Nova Arquitetura Backend VAULTO (Financas Pessoais)

- Status: Proposed
- Data: 2026-07-02
- Decisores: Tech Lead, Backend Team, Product Owner
- Tipo: Arquitetura de Aplicacao e Estrategia de Migracao

## 1. Contexto

O backend atual foi iniciado como base NestJS e evoluiu para um monolito modular com GraphQL, TypeORM e foco forte em autenticacao, autorizacao e padronizacao de erros.

Pontos fortes ja existentes:

- Padrao global de erros com catalogo central e formato GraphQL consistente.
- Estrategia migration-first para producao.
- Guardas globais de autenticacao/autorizacao.
- Separacao inicial por modulos de negocio.
- Boa cobertura inicial de testes unitarios no modulo users.

Principais sinais tecnicos observados para melhoria:

- Acoplamento de regras de negocio com persistencia (services acessam Repository do TypeORM diretamente em varios modulos).
- Services de aplicacao acumulando multiplas responsabilidades (validacao, autorizacao, transacao, persistencia, notificacao).
- Predominio de validadores estaticos e regras em services, em vez de objetos de dominio ricos.
- Mistura de responsabilidades de modulo de dominio com infraestrutura global.
- Setup de testes/cobertura com configuracao desatualizada para o escopo real.
- Inconsistencia de naming e identidade de produto em pontos de health/readme.

## 2. Problema

Para o novo produto VAULTO focado em controle financeiro pessoal (dividas, relatorios, fluxo de caixa, metas), a arquitetura atual precisa suportar:

- Evolucao rapida de regras de negocio sem regressao.
- Escalabilidade funcional por novos contextos de dominio.
- Onboarding rapido de novos devs com fronteiras claras.
- Alta testabilidade por camadas e contratos.
- Extensibilidade (aberta para extensao e fechada para alteracao, OCP).

Sem uma refatoracao arquitetural orientada a dominio, o crescimento tende a aumentar custo de manutencao e risco de regressao.

## 3. Decisao

Adotar arquitetura de Monolito Modular com orientacao a DDD + Clean Architecture + TDD disciplinado, usando ports/adapters por modulo.

Resumo da decisao:

- Manter NestJS como framework de entrega (API GraphQL/HTTP) e DI.
- Reorganizar cada modulo por camadas explicitas:
  - domain (entidades de dominio, value objects, regras, domain services)
  - application (use cases, comandos/consultas, portas)
  - infrastructure (typeorm repos, mapeadores, integrações)
  - presentation (resolvers/controllers/dtos)
- Introduzir contratos (interfaces) na camada application/domain e implementar na infrastructure.
- Padronizar use case por acao de negocio (um caso de uso = uma responsabilidade).
- Evoluir para eventos de dominio e outbox de forma incremental para efeitos colaterais criticos.

## 4. Arquitetura Alvo

## 4.1 Bounded Contexts iniciais para VAULTO

- identity-access: autenticacao, sessao, autorizacao.
- user-profile: dados do usuario e preferencias.
- accounts: contas (carteira, banco, cartao).
- transactions: receitas, despesas, transferencias, recorrencias.
- debts: dividas pessoais, acordos, parcelas, juros, lembretes.
- budgeting: orcamentos por categoria e periodo.
- reporting: relatorios, indicadores, snapshots e exportacoes.
- notifications: emails e alertas de vencimento.

## 4.2 Estrutura de pastas proposta

```text
src/
  modules/
    users/
      domain/
        entities/
        value-objects/
        services/
        events/
        repositories/
      application/
        use-cases/
          create-user/
          update-user-profile/
          change-user-status/
        ports/
        dto/
      infrastructure/
        persistence/
          typeorm/
            entities/
            repositories/
            mappers/
        integrations/
      presentation/
        graphql/
          resolvers/
          input-dto/
          output-dto/
      users.module.ts
  shared/
    kernel/
    application/
    infrastructure/
    observability/
```

## 4.3 Regras arquiteturais obrigatorias

- Domain nao depende de NestJS, TypeORM ou GraphQL.
- Application depende de domain e de portas (interfaces), nunca de adaptadores concretos.
- Infrastructure implementa portas.
- Presentation chama apenas use cases da application.
- Regra de autorizacao em policy/authorizer dedicado por caso de uso.

## 5. Melhorias no modulo users (exemplo de referencia)

## 5.1 O que melhorar imediatamente

- Quebrar services grandes em use cases menores e orientados por intencao de negocio.
- Remover validacoes estaticas dispersas e mover invariantes para entidades/value objects.
- Padronizar transacao por Unit of Work no application layer.
- Extrair side effects (envio de email, permissao de pagina) para handlers de evento de dominio.
- Evitar uso de unknown para usuario autenticado em resolver; adotar tipo CurrentUserClaims.

## 5.2 Refatoracao sugerida do fluxo de criacao de usuario

Estado atual (resumo):

- autoriza
- valida existencia
- gera senha
- abre transacao
- cria usuario e credencial
- configura page access
- envia email

Estado alvo:

- CreateUserUseCase (orquestracao)
- UserFactory (domain)
- IUserRepository, ICredentialRepository, IPageAccessPolicyRepository (ports)
- TransactionManager (port)
- UserCreatedDomainEvent
- UserOnboardingHandler (infrastructure/event handler)

Beneficios:

- SRP: cada classe com uma responsabilidade.
- OCP: novos comportamentos entram por eventos/handlers sem alterar use case.
- DIP: regras dependem de contratos e nao de TypeORM.
- TDD facilitado por mocks de portas.

## 5.3 Politicas e autorizacao

- Trocar chamadas repetidas de AuthorizationService por policy objects por caso de uso:
  - CreateUserPolicy
  - UpdateOwnProfilePolicy
  - ManageUserAccessPolicy
- Manter guardas globais para autenticacao e autorizacao base, mas decisao fina no application.

## 6. Melhorias no projeto como um todo

## 6.1 SOLID, DRY, Clean Code

- Consolidar naming conventions e linguagem ubiqua do dominio financeiro.
- Adotar imports por alias (ex.: @modules, @shared) de forma consistente em todo projeto.
- Evitar duplicacao de padroes de resposta/validacao entre modulos com bibliotecas shared.
- Definir lint rules arquiteturais (dependencia entre camadas por boundary).

## 6.2 DDD

- Criar aggregate roots claros (ex.: Account, Debt, Budget, TransactionBatch).
- Introduzir value objects (Money, Currency, DateRange, InstallmentPlan).
- Publicar eventos de dominio para processos cross-context (ex.: DebtOverdue, BudgetThresholdReached).

## 6.3 TDD e qualidade

- Piramide de testes:
  - unitarios (domain + application) como base principal
  - integracao (repos/adapters)
  - e2e (fluxos criticos: login, registrar despesa, registrar divida, gerar relatorio)
- Cobertura minima por camada critica:
  - domain/application: >= 85%
  - adapters/infrastructure: >= 70%
- Gate de CI para lint + typecheck + testes + coverage threshold.

## 6.4 Observabilidade e operacao

- Logging estruturado com correlation id.
- Metricas tecnicas e de dominio (ex.: total de lancamentos processados, dividas vencidas).
- Tracing em casos de uso de relatorios e importacoes.

## 7. Design Patterns recomendados

- Repository + Data Mapper
- Unit of Work
- Factory Method para criacao de agregados
- Strategy para regras variaveis (juros, recorrencia, classificacao)
- Specification para filtros de consulta complexos
- Domain Events + Observer (event handlers)
- Anti-Corruption Layer para integrações externas

## 8. Plano de Migracao (incremental)

Fase 0 - Baseline tecnico (1 semana)

- Padrao de pastas alvo por modulo.
- Alias de imports e regras de lint arquitetural.
- Ajustes de CI e quality gates.

Fase 1 - Refatorar users como modulo piloto (2 a 3 semanas)

- Criar camadas domain/application/infrastructure/presentation.
- Introduzir portas e adaptadores.
- Extrair eventos para side effects.
- Garantir cobertura de regressao.

Fase 2 - Criar contextos financeiros core (4 a 6 semanas)

- accounts, transactions, debts.
- Modelos de dominio e casos de uso principais.
- Endpoints GraphQL iniciais.

Fase 3 - budgeting e reporting (3 a 5 semanas)

- orcamentos mensais por categoria.
- relatorios analiticos e comparativos.
- exportacao inicial (CSV/PDF).

Fase 4 - hardening operacional (2 semanas)

- observabilidade completa.
- testes de carga em relatorios.
- revisao de seguranca e compliance.

## 9. Estimativa de custos gerais

Premissas:

- Squad: 1 tech lead, 2 devs backend, 1 QA parcial.
- Periodo estimado total: 12 a 17 semanas.

Custos tecnicos (ordem de grandeza):

- Desenvolvimento/refatoracao: 900 a 1300 horas.
- QA e automacao: 180 a 260 horas.
- Arquitetura/documentacao/onboarding: 120 a 180 horas.
- Total estimado: 1200 a 1740 horas.

Custos de infraestrutura (mensal, aproximado, depende de volume):

- Banco gerenciado + backups: baixo a medio.
- Observabilidade (logs/metricas/traces): baixo a medio.
- Filas/eventos (se ativado outbox async): baixo.

ROI esperado:

- Reducao de retrabalho por regressao.
- Menor lead time para features de dominio financeiro.
- Menor tempo de onboarding de novos devs.

## 10. Riscos e mitigacoes

Risco: refatoracao ampla interromper entrega de features.
Mitigacao: migracao por estrangulamento de modulo (users piloto), feature flags e fases curtas.

Risco: aumento temporario de complexidade.
Mitigacao: templates de modulo, guias de arquitetura e code review com checklist.

Risco: baixo alinhamento de naming de dominio.
Mitigacao: glosario de linguagem ubiqua versionado com o time de produto.

## 11. Consequencias

Positivas:

- Escalabilidade de dominio e organizacional.
- Maior previsibilidade de manutencao.
- Base preparada para evolucao para microsservicos apenas quando necessario.

Trade-offs:

- Investimento inicial maior em modelagem e arquitetura.
- Curva de aprendizagem de DDD/Clean para parte do time.

## 12. Criterios de aceite da migracao

- Users migrado para novo padrao com regressao zero em fluxos criticos.
- Novos modulos financeiros iniciados ja no padrao alvo.
- Quality gate ativo e estavel na CI.
- Documento de onboarding tecnico atualizado.

## 13. Decisao final

A migracao e recomendada.

A estrategia de monolito modular orientado a DDD/Clean oferece o melhor equilibrio entre velocidade, custo e robustez para o contexto do VAULTO neste momento.

A adocao deve ser incremental, iniciando por users como piloto arquitetural e expandindo para os bounded contexts financeiros.
