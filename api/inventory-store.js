import fs from 'fs';
import path from 'path';

const INVENTORY_FILE = path.join(process.cwd(), 'db', 'inventory.json');

class InventoryStore {
  constructor() {
    this.client = null;
    this.isRedis = false;
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_KV_URL;
    if (url) {
      try {
        const { createClient } = await import('redis');
        this.client = createClient({ url });
        this.client.on('error', (err) => console.warn('Redis error:', err?.message || err));
        await this.client.connect();
        this.isRedis = true;
        this.ready = true;
        return;
      } catch (e) {
        console.warn('Redis not available, falling back to file storage.', e?.message || e);
      }
    }
    // Ensure file exists
    try {
      const dir = path.dirname(INVENTORY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(INVENTORY_FILE)) fs.writeFileSync(INVENTORY_FILE, '[]', 'utf8');
    } catch {}
    this.ready = true;
  }

  // ----- Redis helpers -----
  async rkey(id) { return `inventory:${id}`; }
  async rset(item) {
    const id = item.id || `item_${Date.now()}`;
    item.id = id;
    await this.client.set(await this.rkey(id), JSON.stringify(item));
    await this.client.sAdd('inventory:ids', id);
    return item;
  }
  async rget(id) {
    const raw = await this.client.get(await this.rkey(id));
    return raw ? JSON.parse(raw) : null;
  }
  async rdel(id) {
    await this.client.del(await this.rkey(id));
    await this.client.sRem('inventory:ids', id);
  }
  async rlist() {
    const ids = await this.client.sMembers('inventory:ids');
    if (!ids || ids.length === 0) return [];
    const multi = this.client.multi();
    for (const id of ids) multi.get(await this.rkey(id));
    const raws = await multi.exec();
    return raws.map(r => (r ? JSON.parse(r) : null)).filter(Boolean);
  }

  // ----- File helpers -----
  fread() {
    try {
      const data = fs.readFileSync(INVENTORY_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  fwrite(items) {
    try { fs.writeFileSync(INVENTORY_FILE, JSON.stringify(items, null, 2), 'utf8'); } catch {}
  }

  // ----- Public API -----
  async list() {
    await this.init();
    if (this.isRedis) return this.rlist();
    return this.fread();
  }

  async create(data) {
    await this.init();
    if (this.isRedis) return this.rset(data);
    const items = this.fread();
    const newItem = { id: data.id || String(Date.now()), ...data };
    items.push(newItem);
    this.fwrite(items);
    return newItem;
  }

  async update(id, data) {
    await this.init();
    if (this.isRedis) {
      const existing = await this.rget(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, id };
      await this.rset(updated);
      return updated;
    }
    const items = this.fread();
    const idx = items.findIndex(x => x.id === id);
    if (idx < 0) return null;
    items[idx] = { ...items[idx], ...data, id };
    this.fwrite(items);
    return items[idx];
  }

  async remove(id) {
    await this.init();
    if (this.isRedis) {
      await this.rdel(id);
      return true;
    }
    const items = this.fread();
    const next = items.filter(x => x.id !== id);
    const removed = next.length !== items.length;
    if (removed) this.fwrite(next);
    return removed;
  }
}

export const inventoryStore = new InventoryStore();

