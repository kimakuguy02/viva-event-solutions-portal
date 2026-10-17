import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/api";
import { getDb, appendAuditLog } from "./server/db";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Security Headers (CSP compatible YouTube/Supabase/Firebase/Google — voir docs/SECURITY_ARCHITECTURE.md)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
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

  if (process.env.NODE_ENV !== "production") {
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
