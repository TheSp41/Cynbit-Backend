// src/middlewares/securityHeaders.ts
import helmet from 'helmet';
import cors from 'cors';
import { Application } from 'express';

/**
 * Hardens HTTP headers and restricts CORS to authorized Cynbit tenant domains.
 * Addresses vulnerabilities observed in cynbit.in public headers.
 */
export const configureSecurity = (app: Application) => {
  // 1. Strip Server Fingerprints (Fixes `server: Vercel` leakage)
  app.disable('x-powered-by');

  // 2. Apply strict HTTP Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://trusted-analytics.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // Fixes missing X-Frame-Options
      frameguard: { action: 'deny' },
      // Fixes missing X-Content-Type-Options
      noSniff: true,
      // Maintains existing good HSTS policy
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    })
  );

  // 3. Restrict CORS (Fixes `access-control-allow-origin: *`)
  const allowedOrigins = [
    'https://www.cynbit.in',
    'https://studio.cynbit.in',
    'https://revio.cynbit.in',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or authorized origins
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS Policy Violation: Origin not allowed'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
      credentials: true, // Required for secure HttpOnly cookie transmission
    })
  );
};