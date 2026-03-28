import { ElectronAPI } from '@electron-toolkit/preload'

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

export interface DbAPI {
  getGuests: () => Promise<Guest[]>
  addGuest: (guest: GuestInput) => Promise<Guest>
  updateGuest: (id: number, guest: Partial<GuestInput>) => Promise<Guest | undefined>
  deleteGuest: (id: number) => Promise<void>
  searchGuests: (query: string) => Promise<Guest[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DbAPI
  }
}
