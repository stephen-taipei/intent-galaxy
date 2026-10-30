#!/usr/bin/env node
// Prints an HS256 JWT with role service_role for the Worker secret
// SUPABASE_SERVICE_ROLE_KEY. Reads the secret from PGRST_JWT_SECRET so it never
// appears in shell history. Usage: PGRST_JWT_SECRET=... node mint-service-token.mjs [days]
import { createHmac } from 'node:crypto';

const secret = process.env.PGRST_JWT_SECRET || '';
if (secret.length < 32) { console.error('Set PGRST_JWT_SECRET (at least 32 characters).'); process.exit(1); }
const days = Number(process.argv[2] || 365);
if (!Number.isInteger(days) || days < 1 || days > 730) { console.error('Days must be an integer from 1 to 730.'); process.exit(1); }
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role: 'service_role', iat: now, exp: now + days * 86400 })}`;
process.stdout.write(`${body}.${createHmac('sha256', secret).update(body).digest('base64url')}\n`);
