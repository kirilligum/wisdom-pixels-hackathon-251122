import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { Database as DbType } from './types';

export const createD1Db = (db: D1Database): DbType => drizzle(db, { schema });
