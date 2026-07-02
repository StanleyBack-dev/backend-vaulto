// LIBS
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import type { Request } from "express";

// MODULES
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Attach raw body buffer to request for HMAC webhook verification
  app.use(
    bodyParser.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: Request & { rawBody?: Buffer }, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT") || 4000;
  const corsOptions = config.get("cors");

  app.enableCors(corsOptions);

  await app.listen(port);
  console.log(`\n🚀 Servidor rodando em http://localhost:${port}/graphql`);
}

bootstrap();
