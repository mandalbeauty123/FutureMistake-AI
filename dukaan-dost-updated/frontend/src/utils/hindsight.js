// Hindsight Memory Allocation System
// Manages a bounded memory store of past business decisions + outcomes

const MEMORY_LIMIT = 200 // max decisions to retain
const MEMORY_KEY = 'dd_hindsight_memory'

/**
 * Memory Entry Schema:
 * {
 *   id: string,
 *   timestamp: ISO string,
 *   type: 'purchase' | 'price_change' | 'promo' | 'restock' | 'disposal',
 *   product: string,
 *   action: string,
 *   context: { season, festival, weekday, weather },
 *   outcome: { profit, units_sold, days_to_clear, verdict: 'good'|'bad'|'neutral' },
 *   embedding: number[]  // simple feature vector for similarity search
 * }
 */

export class HindsightMemory {
  constructor() {
    this.memories = this._load()
  }

  _load() {
    try {
      const raw = localStorage.getItem(MEMORY_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  _save() {
    // If over limit, evict oldest bad decisions first, then oldest neutral, then oldest good
    if (this.memories.length > MEMORY_LIMIT) {
      const bad     = this.memories.filter(m => m.outcome?.verdict === 'bad')
      const neutral = this.memories.filter(m => m.outcome?.verdict === 'neutral')
      const good    = this.memories.filter(m => m.outcome?.verdict === 'good')

      // Sort each group by timestamp ascending (oldest first)
      const sortAsc = arr => arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      const evictCount = this.memories.length - MEMORY_LIMIT
      let toEvict = []
      toEvict.push(...sortAsc(bad).slice(0, evictCount))
      if (toEvict.length < evictCount) toEvict.push(...sortAsc(neutral).slice(0, evictCount - toEvict.length))
      if (toEvict.length < evictCount) toEvict.push(...sortAsc(good).slice(0, evictCount - toEvict.length))

      const evictIds = new Set(toEvict.map(m => m.id))
      this.memories = this.memories.filter(m => !evictIds.has(m.id))
    }
    localStorage.setItem(MEMORY_KEY, JSON.stringify(this.memories))
  }

  _featureVector(entry) {
    // Simple numeric feature vector for similarity scoring
    const typeMap = { purchase: 0, price_change: 1, promo: 2, restock: 3, disposal: 4 }
    const verdictMap = { good: 1, neutral: 0, bad: -1 }
    const d = new Date(entry.timestamp)
    return [
      typeMap[entry.type] ?? 0,
      d.getMonth(),                          // seasonality
      d.getDay(),                            // weekday
      verdictMap[entry.outcome?.verdict] ?? 0,
      entry.outcome?.profit ?? 0,
      entry.outcome?.units_sold ?? 0,
    ]
  }

  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0)
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
    return magA && magB ? dot / (magA * magB) : 0
  }

  add(entry) {
    const mem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }
    mem.embedding = this._featureVector(mem)
    this.memories.unshift(mem)
    this._save()
    return mem
  }

  getAll() { return [...this.memories] }

  getByProduct(productName) {
    return this.memories.filter(m => m.product?.toLowerCase().includes(productName.toLowerCase()))
  }

  getByType(type) { return this.memories.filter(m => m.type === type) }

  getRecent(n = 10) { return this.memories.slice(0, n) }

  // Find similar past decisions (used for AI experiment prediction)
  findSimilar(query, topN = 5) {
    const qVec = this._featureVector({ ...query, timestamp: new Date().toISOString() })
    return this.memories
      .map(m => ({ ...m, score: this._cosineSimilarity(qVec, m.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
  }

  // Compute stats summary for dashboard
  getStats() {
    const total = this.memories.length
    const good  = this.memories.filter(m => m.outcome?.verdict === 'good').length
    const bad   = this.memories.filter(m => m.outcome?.verdict === 'bad').length
    const totalProfit = this.memories.reduce((s, m) => s + (m.outcome?.profit ?? 0), 0)
    const lossPrevented = this.memories
      .filter(m => m.outcome?.verdict === 'good')
      .reduce((s, m) => s + Math.abs(m.outcome?.profit ?? 0), 0)

    return {
      total,
      good,
      bad,
      accuracy: total ? Math.round((good / total) * 100) : 0,
      totalProfit: Math.round(totalProfit),
      lossPrevented: Math.round(lossPrevented * 0.3), // estimate
    }
  }

  // Build context string for AI prompt injection
  buildContextForAI(productName = null, limit = 8) {
    const mems = productName ? this.getByProduct(productName) : this.getRecent(limit)
    if (!mems.length) return 'No past decisions recorded yet.'
    return mems.map(m =>
      `[${m.timestamp.slice(0, 10)}] ${m.type.toUpperCase()}: "${m.product}" — ${m.action} → ${m.outcome?.verdict?.toUpperCase()} (₹${m.outcome?.profit ?? 0} profit, ${m.outcome?.units_sold ?? '?'} units sold)`
    ).join('\n')
  }

  clear() {
    this.memories = []
    localStorage.removeItem(MEMORY_KEY)
  }
}

// Singleton
export const hindsight = new HindsightMemory()
