import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import cron from "node-cron";
import { EntrevistaService } from "./services/entrevista-service";
import { CommunicationService } from "./services/communication-service";
// import cors from 'cors'; // Removido para testar sem CORS

const app = express();

// Removido: app.use(cors({ ... }))

// Desabilitar ETag para evitar respostas 304 e garantir sempre status 200
app.disable('etag');

// Aplicar rate limiting global para APIs
app.use("/api", apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "192.168.77.3",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    // Initialize database with seed data
    try {
      await seedDatabase();
    } catch (error) {
      console.error("Failed to seed database, but server will continue:", error);
    }

    // Job de lembrete automático de entrevistas
    cron.schedule("*/15 * * * *", async () => {
      try {
        const agora = new Date();
        const entrevistas = await EntrevistaService.listarEntrevistas({ status: "agendada" }, { perfil: "admin" });
        const communicationService = new CommunicationService();
        for (const entrevista of entrevistas) {
          if (!entrevista.dataHora) continue;
          const dataEntrevista = new Date(entrevista.dataHora);
          const diffMs = dataEntrevista.getTime() - agora.getTime();
          const diffH = diffMs / (1000 * 60 * 60);
          // Lembrete 24h antes
          if (diffH > 23.5 && diffH < 24.5) {
            if (!entrevista.confirmadoCandidato) {
              const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-presenca?id=${entrevista.id}&token=${entrevista.tokenConfirmacaoCandidato}&tipo=candidato`;
              const mensagem = `Olá ${entrevista.candidato?.nome},\n\nLembrete: sua entrevista para a vaga "${entrevista.vaga?.titulo}" é amanhã às ${dataEntrevista.toLocaleString('pt-BR')}.\nPor favor, confirme sua presença: ${link}`;
              if (entrevista.candidato?.email) {
                await communicationService.enviarComunicacao('email', entrevista.candidato, mensagem, `Lembrete de Entrevista - ${entrevista.vaga?.titulo}`);
              }
            }
            if (!entrevista.confirmadoEntrevistador) {
              const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-presenca?id=${entrevista.id}&token=${entrevista.tokenConfirmacaoEntrevistador}&tipo=entrevistador`;
              const mensagem = `Olá ${entrevista.entrevistador?.nome},\n\nLembrete: você irá entrevistar "${entrevista.candidato?.nome}" amanhã às ${dataEntrevista.toLocaleString('pt-BR')} para a vaga "${entrevista.vaga?.titulo}".\nPor favor, confirme sua presença: ${link}`;
              if (entrevista.entrevistador?.email) {
                await communicationService.enviarComunicacao('email', entrevista.entrevistador, mensagem, `Lembrete de Entrevista - ${entrevista.vaga?.titulo}`);
              }
            }
          }
          // Lembrete 1h antes
          if (diffH > 0.5 && diffH < 1.5) {
            if (!entrevista.confirmadoCandidato) {
              const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-presenca?id=${entrevista.id}&token=${entrevista.tokenConfirmacaoCandidato}&tipo=candidato`;
              const mensagem = `Olá ${entrevista.candidato?.nome},\n\nLembrete: sua entrevista para a vaga "${entrevista.vaga?.titulo}" é em 1 hora (${dataEntrevista.toLocaleString('pt-BR')}).\nPor favor, confirme sua presença: ${link}`;
              if (entrevista.candidato?.email) {
                await communicationService.enviarComunicacao('email', entrevista.candidato, mensagem, `Lembrete de Entrevista - ${entrevista.vaga?.titulo}`);
              }
            }
            if (!entrevista.confirmadoEntrevistador) {
              const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-presenca?id=${entrevista.id}&token=${entrevista.tokenConfirmacaoEntrevistador}&tipo=entrevistador`;
              const mensagem = `Olá ${entrevista.entrevistador?.nome},\n\nLembrete: você irá entrevistar "${entrevista.candidato?.nome}" em 1 hora (${dataEntrevista.toLocaleString('pt-BR')}) para a vaga "${entrevista.vaga?.titulo}".\nPor favor, confirme sua presença: ${link}`;
              if (entrevista.entrevistador?.email) {
                await communicationService.enviarComunicacao('email', entrevista.entrevistador, mensagem, `Lembrete de Entrevista - ${entrevista.vaga?.titulo}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Erro no job de lembrete de entrevistas:', err);
      }
    });
  });
})();
