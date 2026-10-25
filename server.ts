import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/api";
import { getDb, appendAuditLog } from "./server/db";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Le mode est explicite et multiplateforme : npm sous Windows exécute les
// scripts via cmd, où « NODE_ENV=production node ... » échoue. `npm run dev`
// passe --dev ; sinon la présence du build compilé fait foi.
const isDevServer = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
const hasBuild = fs.existsSync(path.join(process.cwd(), "dist", "index.html"));

// Security Headers (CSP compatible YouTube/Supabase/Firebase/Google — voir docs/SECURITY_ARCHITECTURE.md)
const isProduction = !isDevServer && (process.env.NODE_ENV === "production" || hasBuild);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // La CSP stricte casse le script inline et le WebSocket de Vite (port 24678) :
  // elle n'est envoyée qu'en production, où le HTML compilé ne contient aucun script inline.
  if (isProduction) {
    res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' https://apis.google.com https://www.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "media-src 'self' https: blob:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://*.firebaseio.com; " +
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
    );
  }
  next();
});

// API: Health check (minimal — aucune donnée interne)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "VIVA EVENT SOLUTIONS Backend",
    time: new Date().toISOString()
  });
});

// Mount Central Modular REST API
app.use("/api", apiRouter);

// Start server with Vite middleware integration
async function startServer() {
  // Initialize persistent DB on start
  getDb();

  if (isDevServer || !hasBuild) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VIVA EVENT SOLUTIONS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
