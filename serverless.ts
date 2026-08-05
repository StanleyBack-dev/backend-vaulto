// Must run before any other import: Vercel's builder compiles this file's
// module graph to plain CommonJS without rewriting the "@/..." path
// aliases into relative requires, so nothing else resolves them at
// runtime unless this registers a resolver first (mirrors the
// `-r tsconfig-paths/register` flag used by the local `npm start`).
import "tsconfig-paths/register";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";
import { ConfigService } from "@nestjs/config";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { createServer } from "http";

type RawRequest = Request & { rawBody?: Buffer };

const expressApp = express();
let server: ReturnType<typeof createServer> | null = null;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ["error", "warn"] },
  );

  app.use(
    bodyParser.json({
      verify: (req: RawRequest, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: RawRequest, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const corsOptions = config.get("cors");
  app.enableCors(corsOptions);

  await app.init();
  server = createServer(expressApp);
}

async function handler(req: Request, res: Response): Promise<void> {
  try {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap().catch((err) => {
        bootstrapPromise = null;
        throw err;
      });
    }

    await bootstrapPromise;
    server!.emit("request", req, res);
  } catch (err) {
    console.error("Erro ao inicializar NestJS:", err);
    res.statusCode = 500;
    res.end("Erro interno ao iniciar o servidor");
  }
}

module.exports = handler;
