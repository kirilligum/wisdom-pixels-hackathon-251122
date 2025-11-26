#!/usr/bin/env ts-node

/**
 * Wisdom Pixels REST API Entry Point (Hono + hot reload via tsx watch)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { serve } from '@hono/node-server';
import { createApiApp } from './app.js';
import { loadApiConfig } from './config.js';
import { db } from '../mastra/db/client.js';

const config = loadApiConfig(process.env as Record<string, string | undefined>);
const app = createApiApp({ db, config });

const port = Number(process.env.API_PORT || 3001);
console.log(`🚀 Hono API starting on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
