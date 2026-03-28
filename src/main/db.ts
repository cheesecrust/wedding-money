import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

export interface Guest {
  id: number
  name: string
  amount: number
  meal_tickets: number
  relationship: string
  gift: string
  delivery_method: string
  memo: string
  created_at: string
}

export type GuestInput = Omit<Guest, 'id' | 'created_at'>

let db: Database.Database

export function initDB(): void {
  const dbPath = join(app.getPath('userData'), 'wedding-money.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      meal_tickets INTEGER NOT NULL DEFAULT 0,
      relationship TEXT NOT NULL DEFAULT '',
      gift TEXT NOT NULL DEFAULT '',
      delivery_method TEXT NOT NULL DEFAULT '',
      memo TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // Migrate existing DB: add new columns if missing
  const columns = db.prepare('PRAGMA table_info(guests)').all() as { name: string }[]
  const colNames = columns.map((c) => c.name)

  if (!colNames.includes('meal_tickets')) {
    db.exec('ALTER TABLE guests ADD COLUMN meal_tickets INTEGER NOT NULL DEFAULT 0')
  }
  if (!colNames.includes('gift')) {
    db.exec("ALTER TABLE guests ADD COLUMN gift TEXT NOT NULL DEFAULT ''")
  }
  if (!colNames.includes('delivery_method')) {
    db.exec("ALTER TABLE guests ADD COLUMN delivery_method TEXT NOT NULL DEFAULT ''")
  }
}

export function getGuests(): Guest[] {
  return db
    .prepare(
      'SELECT id, name, amount, meal_tickets, relationship, gift, delivery_method, memo, created_at FROM guests ORDER BY id DESC'
    )
    .all() as Guest[]
}

export function addGuest(guest: GuestInput): Guest {
  const stmt = db.prepare(
    'INSERT INTO guests (name, amount, meal_tickets, relationship, gift, delivery_method, memo) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const result = stmt.run(
    guest.name,
    guest.amount,
    guest.meal_tickets,
    guest.relationship,
    guest.gift,
    guest.delivery_method,
    guest.memo
  )
  return db.prepare('SELECT * FROM guests WHERE id = ?').get(result.lastInsertRowid) as Guest
}

export function updateGuest(id: number, guest: Partial<GuestInput>): Guest | undefined {
  const current = db.prepare('SELECT * FROM guests WHERE id = ?').get(id) as Guest | undefined
  if (!current) return undefined

  const updated = { ...current, ...guest }
  const stmt = db.prepare(
    'UPDATE guests SET name = ?, amount = ?, meal_tickets = ?, relationship = ?, gift = ?, delivery_method = ?, memo = ? WHERE id = ?'
  )
  stmt.run(
    updated.name,
    updated.amount,
    updated.meal_tickets,
    updated.relationship,
    updated.gift,
    updated.delivery_method,
    updated.memo,
    id
  )
  return db.prepare('SELECT * FROM guests WHERE id = ?').get(id) as Guest | undefined
}

export function deleteGuest(id: number): void {
  db.prepare('DELETE FROM guests WHERE id = ?').run(id)
}

export function searchGuests(query: string): Guest[] {
  const pattern = `%${query}%`
  return db
    .prepare(
      'SELECT id, name, amount, meal_tickets, relationship, gift, delivery_method, memo, created_at FROM guests WHERE name LIKE ? OR relationship LIKE ? OR memo LIKE ? ORDER BY id DESC'
    )
    .all(pattern, pattern, pattern) as Guest[]
}
