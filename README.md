# Cynbit - Backend Technical Audit & Architectural Improvements

**Role:** Backend Developer Intern
**Date:** October 31, 2026
**Methodology:** 100% passive, authorized external reconnaissance (HTTP HEAD/OPTIONS requests, browser network inspection) on `https://www.cynbit.in`.

## 1. Executive Summary & Infrastructure Overview
Based on external headers, `cynbit.in` is built using **Next.js (App Router)** with React Server Components, statically generated (`x-nextjs-prerender: 1`), and deployed on **Vercel** (`server: Vercel`, edge node: `bom1` - Mumbai). 

While the frontend delivery is highly optimized with edge caching, the backend architecture requires significant hardening regarding API security, payload validation, and rate limiting to support SaaS products like Cynbit Studio and TenantEase.

## 2. Security & Performance Findings

| Category | Observation | Impact & Risk |
| :--- | :--- | :--- |
| **Security (CORS)** | `access-control-allow-origin: *` | **High:** A wildcard CORS policy allows any external domain to attempt API calls. |
| **Security (Headers)** | Missing CSP, `X-Content-Type-Options`, and `X-Frame-Options`. | **Medium:** Leaves the application vulnerable to Clickjacking and MIME-type sniffing. |
| **Performance (Cache)** | `cache-control: public, max-age=0, must-revalidate` | **Low:** Forces a network round-trip for static assets instead of utilizing `stale-while-revalidate` for instant loading. |
| **API Stability & Error Handling** | The `contact` Server Action currently fails in production, returning a generic frontend error message. | **High:** A critical business ingestion path is broken. This indicates an unhandled backend exception (e.g., database connection failure or SMTP timeout) and a lack of proper error boundaries or alerting. |
| **Bot Protection & Rate Limiting** | Public ingestion forms process raw payloads with no observable rate limiting, CAPTCHA, or CSRF tokens. | **High:** Forms are vulnerable to automated bot abuse, spam, and database enumeration without a Token Bucket or sliding window limiter. |

## 3. Recommended Architectural Improvements
To transition Cynbit's infrastructure from a static marketing site to a secure SaaS backend, I recommend implementing a decoupled backend service (e.g., Node.js/Express or FastAPI) with the following improvements:

1. **Strict Input Validation:** Never trust client data. All incoming payloads must be parsed and sanitized using a schema validator like Zod.
2. **Rate Limiting & Idempotency:** Protect endpoints from bot floods using a Redis-backed sliding window rate limiter.
3. **Global Error Handling:** Stop leaking stack traces or HTML 404 pages on API routes. Implement a global exception filter that returns clean JSON envelopes, and ensure Server Actions catch exceptions gracefully.

*(Reference code for these improvements can be found in the `/src` directory of this repository).*