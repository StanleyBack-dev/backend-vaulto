export const RESPONSE_MESSAGES = {
  auth: {
    logout: {
      code: "AUTH_LOGOUT_SUCCESS",
      message: "Logout realizado com sucesso.",
    },
    passwordChanged: {
      code: "AUTH_PASSWORD_CHANGED",
      message: "Senha alterada com sucesso.",
    },
    passwordRecoveryRequested: {
      code: "AUTH_PASSWORD_RECOVERY_REQUESTED",
      message:
        "Se o e-mail estiver cadastrado, voce recebera um codigo para recuperar a senha.",
    },
    passwordRecoveryCodeValidated: {
      code: "AUTH_PASSWORD_RECOVERY_CODE_VALIDATED",
      message: "Codigo validado com sucesso.",
    },
    passwordRecovered: {
      code: "AUTH_PASSWORD_RECOVERED",
      message: "Senha redefinida com sucesso.",
    },
    onboardingTourCompleted: {
      code: "AUTH_ONBOARDING_TOUR_COMPLETED",
      message: "Tour de apresentação concluído.",
    },
  },
  users: {
    created: {
      code: "USER_CREATED",
      message: "Usuário criado com sucesso.",
    },
    updated: {
      code: "USER_UPDATED",
      message: "Usuário atualizado com sucesso.",
    },
    accessUpdated: {
      code: "USER_ACCESS_UPDATED",
      message: "Acesso do usuário atualizado com sucesso.",
    },
    unlocked: {
      code: "USER_UNLOCKED",
      message: "Usuário desbloqueado com sucesso.",
    },
    permissionsUpdated: {
      code: "USER_PAGE_PERMISSIONS_UPDATED",
      message: "Permissões de páginas do usuário atualizadas com sucesso.",
    },
    listed: {
      code: "USERS_LISTED",
      message: "Usuários carregados com sucesso.",
    },
  },
  debts: {
    created: {
      code: "DEBT_CREATED",
      message: "Divida criada com sucesso.",
    },
    listed: {
      code: "DEBTS_LISTED",
      message: "Dividas carregadas com sucesso.",
    },
    paymentRegistered: {
      code: "DEBT_PAYMENT_REGISTERED",
      message: "Pagamento da divida registrado com sucesso.",
    },
    statusUpdated: {
      code: "DEBT_STATUS_UPDATED",
      message: "Status da divida atualizado com sucesso.",
    },
    detailsUpdated: {
      code: "DEBT_DETAILS_UPDATED",
      message: "Dados da divida atualizados com sucesso.",
    },
    deleted: {
      code: "DEBT_DELETED",
      message: "Divida excluida com sucesso.",
    },
  },
  incomes: {
    created: {
      code: "INCOME_CREATED",
      message: "Receita criada com sucesso.",
    },
    listed: {
      code: "INCOMES_LISTED",
      message: "Receitas carregadas com sucesso.",
    },
    detailsUpdated: {
      code: "INCOME_DETAILS_UPDATED",
      message: "Dados da receita atualizados com sucesso.",
    },
    statusUpdated: {
      code: "INCOME_STATUS_UPDATED",
      message: "Status da receita atualizado com sucesso.",
    },
    deleted: {
      code: "INCOME_DELETED",
      message: "Receita excluída com sucesso.",
    },
  },
  goals: {
    created: {
      code: "GOAL_CREATED",
      message: "Meta criada com sucesso.",
    },
    listed: {
      code: "GOALS_LISTED",
      message: "Metas carregadas com sucesso.",
    },
    updated: {
      code: "GOAL_UPDATED",
      message: "Meta atualizada com sucesso.",
    },
    deleted: {
      code: "GOAL_DELETED",
      message: "Meta excluída com sucesso.",
    },
    contributionRegistered: {
      code: "GOAL_CONTRIBUTION_REGISTERED",
      message: "Contribuição registrada com sucesso.",
    },
    contributionUpdated: {
      code: "GOAL_CONTRIBUTION_UPDATED",
      message: "Contribuição atualizada com sucesso.",
    },
    contributionDeleted: {
      code: "GOAL_CONTRIBUTION_DELETED",
      message: "Contribuição excluída com sucesso.",
    },
  },
  payments: {
    registered: {
      code: "PAYMENT_REGISTERED",
      message: "Pagamento registrado com sucesso.",
    },
    listed: {
      code: "PAYMENTS_LISTED",
      message: "Pagamentos carregados com sucesso.",
    },
    updated: {
      code: "PAYMENT_UPDATED",
      message: "Pagamento atualizado com sucesso.",
    },
    deleted: {
      code: "PAYMENT_DELETED",
      message: "Pagamento excluido com sucesso.",
    },
  },
  incomeReceipts: {
    registered: {
      code: "INCOME_RECEIPT_REGISTERED",
      message: "Recebimento registrado com sucesso.",
    },
    listed: {
      code: "INCOME_RECEIPTS_LISTED",
      message: "Recebimentos carregados com sucesso.",
    },
    updated: {
      code: "INCOME_RECEIPT_UPDATED",
      message: "Recebimento atualizado com sucesso.",
    },
    deleted: {
      code: "INCOME_RECEIPT_DELETED",
      message: "Recebimento excluído com sucesso.",
    },
  },
  categories: {
    created: {
      code: "CATEGORY_CREATED",
      message: "Categoria criada com sucesso.",
    },
    updated: {
      code: "CATEGORY_UPDATED",
      message: "Categoria atualizada com sucesso.",
    },
    listed: {
      code: "CATEGORIES_LISTED",
      message: "Categorias carregadas com sucesso.",
    },
  },
  profiles: {
    updated: {
      code: "PROFILE_UPDATED",
      message: "Perfil atualizado com sucesso.",
    },
  },
  creditCards: {
    created: {
      code: "CREDIT_CARD_CREATED",
      message: "Cartao de credito criado com sucesso.",
    },
    updated: {
      code: "CREDIT_CARD_UPDATED",
      message: "Cartao de credito atualizado com sucesso.",
    },
    listed: {
      code: "CREDIT_CARDS_LISTED",
      message: "Cartoes de credito carregados com sucesso.",
    },
  },
  legal: {
    termsAccepted: {
      code: "LEGAL_TERMS_ACCEPTED",
      message: "Termos de Uso e Política de Privacidade aceitos com sucesso.",
    },
  },
} as const;
