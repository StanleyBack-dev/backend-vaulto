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
  accounts: {
    created: {
      code: "ACCOUNT_CREATED",
      message: "Conta criada com sucesso.",
    },
    listed: {
      code: "ACCOUNTS_LISTED",
      message: "Contas carregadas com sucesso.",
    },
    transferred: {
      code: "ACCOUNTS_TRANSFERRED",
      message: "Transferencia entre contas realizada com sucesso.",
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
  },
  transactions: {
    created: {
      code: "TRANSACTION_CREATED",
      message: "Transacao registrada com sucesso.",
    },
    listed: {
      code: "TRANSACTIONS_LISTED",
      message: "Transacoes carregadas com sucesso.",
    },
    reported: {
      code: "TRANSACTIONS_REPORTED",
      message: "Relatorio de transacoes carregado com sucesso.",
    },
  },
  profiles: {
    updated: {
      code: "PROFILE_UPDATED",
      message: "Perfil atualizado com sucesso.",
    },
  },
} as const;
