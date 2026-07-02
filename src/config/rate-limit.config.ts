import type { ConfigService } from "@nestjs/config";

export const rateLimitConfig = (configService: ConfigService) => ({
  global: {
    ttl: configService.get<number>("RATE_LIMIT_GLOBAL_TTL"), // TIME WINDOW IN SECONDS (1 MINUTE)
    limit: configService.get<number>("RATE_LIMIT_GLOBAL_LIMIT"), // MAX 100 REQUESTS PER WINDOW
  },

  users: {
    ttl: configService.get<number>("RATE_LIMIT_USERS_TTL"), // 1 MINUTE WINDOW
    limit: configService.get<number>("RATE_LIMIT_USERS_LIMIT"), // GENEROUS LIMIT FOR FREQUENT GRAPHQL QUERIES
  },

  mails: {
    ttl: configService.get<number>("RATE_LIMIT_MAILS_TTL"), // 1 HOUR WINDOW
    limit: configService.get<number>("RATE_LIMIT_MAILS_LIMIT"), // MAX 5 EMAILS PER HOUR
  },

  customers: {
    ttl: configService.get<number>("RATE_LIMIT_CUSTOMERS_TTL"), // 30 SECONDS WINDOW
    limit: configService.get<number>("RATE_LIMIT_CUSTOMERS_LIMIT"), // UP TO 10 CHECKS PER 30 SECONDS
  },

  default: {
    ttl: configService.get<number>("RATE_LIMIT_DEFAULT_TTL"), // DEFAULT 1 MINUTE WINDOW
    limit: configService.get<number>("RATE_LIMIT_DEFAULT_LIMIT"), // 50 REQUESTS IF NO SPECIFIC RULE MATCHES
  },
});
