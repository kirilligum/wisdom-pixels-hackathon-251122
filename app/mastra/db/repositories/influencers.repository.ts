import { eq } from 'drizzle-orm';
import type { Database } from '../types';
import { influencers, type Influencer, type NewInfluencer } from '../schema';

export class InfluencersRepository {
  private readonly client: any;
  private readonly exec: any;
  private readonly MAX_INLINE = 8000;

  constructor(private db: Database) {
    const dbAny = db as any;
    this.client = dbAny.session?.client || dbAny.$client || dbAny.client;
    this.exec = typeof dbAny.execute === 'function' ? dbAny.execute.bind(dbAny) : undefined;
  }

  private getSqlClient() {
    const dbAny = this.db as any;
    return this.client || dbAny.session?.client || dbAny.$client || dbAny.client;
  }

  private toTimestampSeconds(value?: any) {
    if (value instanceof Date) return Math.floor(value.getTime() / 1000);
    if (typeof value === 'number') return Math.floor(value / 1000);
    return Math.floor(Date.now() / 1000);
  }

  private normalizeUrl(url: any) {
    if (!url) return '';
    const str = String(url).trim();
    if (!str) return '';
    if (str.startsWith('data:') || str.length > this.MAX_INLINE) {
      return '';
    }
    return str;
  }

  private normalizeActionUrls(urls: any, label: string) {
    const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
    const cleaned = list.map((u) => this.normalizeUrl(u)).filter(Boolean) as string[];
    return cleaned;
  }

  private async runStatement(stmt: any) {
    if (stmt && typeof stmt.run === 'function') {
      await stmt.run();
      return;
    }
    if (stmt && typeof stmt.execute === 'function') {
      await stmt.execute();
      return;
    }
    await stmt;
  }

  /**
   * Create a new influencer
   */
  async create(data: Omit<NewInfluencer, 'influencerId' | 'createdAt'>): Promise<Influencer> {
    const influencerId = crypto.randomUUID();

    const actionImages = this.normalizeActionUrls(data.actionImageUrls ?? [], data.name || 'Influencer');
    const values = {
      ...data,
      influencerId,
      enabled: data.enabled ?? true,
      status: (data as any).status ?? 'pending',
      errorMessage: (data as any).errorMessage ?? null,
      createdAt: (data as any).createdAt ?? new Date(),
      actionImageUrls: actionImages,
      imageUrl: this.normalizeUrl((data as any).imageUrl),
    };

    const client = this.getSqlClient();
    if (client && typeof client.prepare === 'function') {
      const stmt = client.prepare(
        'INSERT INTO influencers (influencer_id, name, bio, domain, image_url, action_image_urls, enabled, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      );
      await stmt
        .bind(
          values.influencerId,
          values.name,
          values.bio,
          values.domain,
          values.imageUrl,
          JSON.stringify(values.actionImageUrls ?? []),
          values.enabled ? 1 : 0,
          values.status,
          values.errorMessage,
          this.toTimestampSeconds(values.createdAt),
        )
        .run();
      const created = await this.findById(influencerId);
      if (!created) throw new Error('Failed to create influencer');
      return created;
    }

    if (this.exec) {
      await this.exec(
        'INSERT INTO influencers (influencer_id, name, bio, domain, image_url, action_image_urls, enabled, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          values.influencerId,
          values.name,
          values.bio,
          values.domain,
          values.imageUrl,
          JSON.stringify(values.actionImageUrls ?? []),
          values.enabled ? 1 : 0,
          values.status,
          values.errorMessage,
          this.toTimestampSeconds(values.createdAt),
        ],
      );
      const created = await this.findById(influencerId);
      if (!created) throw new Error('Failed to create influencer');
      return created;
    }

    await this.runStatement(this.db.insert(influencers).values(values));
    const created = await this.findById(influencerId);
    if (!created) throw new Error('Failed to create influencer');
    return created;
  }

  /**
   * Get influencer by ID
   */
  async findById(influencerId: string): Promise<Influencer | undefined> {
    const [influencer] = await this.db
      .select()
      .from(influencers)
      .where(eq(influencers.influencerId, influencerId))
      .limit(1);

    return influencer;
  }

  /**
   * Get all influencers
   */
  async findAll(): Promise<Influencer[]> {
    return await this.db.select().from(influencers);
  }

  /**
   * Get only enabled influencers
   */
  async findEnabled(): Promise<Influencer[]> {
    return await this.db
      .select()
      .from(influencers)
      .where(eq(influencers.enabled, true));
  }

  /**
   * Update influencer
   */
  async update(influencerId: string, data: Partial<Omit<Influencer, 'influencerId' | 'createdAt'>>): Promise<Influencer | undefined> {
    const client = this.getSqlClient() || (this.db as any).$client || (this.db as any).client;
    const actionImages = data.actionImageUrls !== undefined
      ? this.normalizeActionUrls(data.actionImageUrls, data.name || 'Influencer')
      : undefined;
    const normalizedImageUrl = data.imageUrl !== undefined ? this.normalizeUrl(data.imageUrl) : undefined;

    if (client && typeof client.prepare === 'function') {
      const fields: string[] = [];
      const params: any[] = [];
      if (data.name !== undefined) {
        fields.push('name = ?');
        params.push(data.name);
      }
      if (data.bio !== undefined) {
        fields.push('bio = ?');
        params.push(data.bio);
      }
      if (data.domain !== undefined) {
        fields.push('domain = ?');
        params.push(data.domain);
      }
      if (data.imageUrl !== undefined) {
        fields.push('image_url = ?');
        params.push(normalizedImageUrl);
      }
      if (actionImages !== undefined) {
        fields.push('action_image_urls = ?');
        params.push(JSON.stringify(actionImages));
      }
      if (data.enabled !== undefined) {
        fields.push('enabled = ?');
        params.push(data.enabled ? 1 : 0);
      }
      if ((data as any).status !== undefined) {
        fields.push('status = ?');
        params.push((data as any).status);
      }
      if ((data as any).errorMessage !== undefined) {
        fields.push('error_message = ?');
        params.push((data as any).errorMessage);
      }
      if (fields.length > 0) {
        params.push(influencerId);
        const stmt = client.prepare(`UPDATE influencers SET ${fields.join(', ')} WHERE influencer_id = ?`);
        await stmt.bind(...params).run();
      }
      return this.findById(influencerId);
    }

    if ((this.db as any).execute) {
      const fields: string[] = [];
      const params: any[] = [];
      if (data.name !== undefined) {
        fields.push('name = ?');
        params.push(data.name);
      }
      if (data.bio !== undefined) {
        fields.push('bio = ?');
        params.push(data.bio);
      }
      if (data.domain !== undefined) {
        fields.push('domain = ?');
        params.push(data.domain);
      }
      if (data.imageUrl !== undefined) {
        fields.push('image_url = ?');
        params.push(normalizedImageUrl);
      }
      if (actionImages !== undefined) {
        fields.push('action_image_urls = ?');
        params.push(JSON.stringify(actionImages));
      }
      if (data.enabled !== undefined) {
        fields.push('enabled = ?');
        params.push(data.enabled ? 1 : 0);
      }
      if ((data as any).status !== undefined) {
        fields.push('status = ?');
        params.push((data as any).status);
      }
      if ((data as any).errorMessage !== undefined) {
        fields.push('error_message = ?');
        params.push((data as any).errorMessage);
      }
      if (fields.length > 0) {
        params.push(influencerId);
        const sql = `UPDATE influencers SET ${fields.join(', ')} WHERE influencer_id = ?`;
        const exec = (this.db as any).execute.bind(this.db);
        await exec(sql, params);
      }
      return this.findById(influencerId);
    }

    // Manual SQL fallback without RETURNING to avoid D1 limitations.
    const fields: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      params.push(data.bio);
    }
    if (data.domain !== undefined) {
      fields.push('domain = ?');
      params.push(data.domain);
    }
    if (data.imageUrl !== undefined) {
      fields.push('image_url = ?');
      params.push(normalizedImageUrl);
    }
    if (actionImages !== undefined) {
      fields.push('action_image_urls = ?');
      params.push(JSON.stringify(actionImages));
    }
    if (data.enabled !== undefined) {
      fields.push('enabled = ?');
      params.push(data.enabled ? 1 : 0);
    }
    if ((data as any).status !== undefined) {
      fields.push('status = ?');
      params.push((data as any).status);
    }
    if ((data as any).errorMessage !== undefined) {
      fields.push('error_message = ?');
      params.push((data as any).errorMessage);
    }
    if (fields.length > 0) {
      params.push(influencerId);
      const sql = `UPDATE influencers SET ${fields.join(', ')} WHERE influencer_id = ?`;
      const runner = client || this.exec || (this.db as any);
      if (runner?.prepare) {
        await runner.prepare(sql).bind(...params).run();
      } else if (runner?.execute) {
        await runner.execute(sql, params);
      } else if (runner?.run) {
        await runner.run(sql, params);
      } else {
        throw new Error('No SQL runner available for update');
      }
    }
    return this.findById(influencerId);
  }

  /**
   * Toggle influencer enabled status
   */
  async toggleEnabled(influencerId: string): Promise<Influencer | undefined> {
    const existing = await this.findById(influencerId);
    if (!existing) return undefined;

    return await this.update(influencerId, { enabled: !existing.enabled });
  }

  /**
   * Delete influencer
   */
  async delete(influencerId: string): Promise<void> {
    await this.db.delete(influencers).where(eq(influencers.influencerId, influencerId));
  }
}
