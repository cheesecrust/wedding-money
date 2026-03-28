import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getGuests: (): Promise<unknown[]> => ipcRenderer.invoke('db:getGuests'),
  addGuest: (guest: unknown): Promise<unknown> => ipcRenderer.invoke('db:addGuest', guest),
  updateGuest: (id: number, guest: unknown): Promise<unknown> =>
    ipcRenderer.invoke('db:updateGuest', id, guest),
  deleteGuest: (id: number): Promise<void> => ipcRenderer.invoke('db:deleteGuest', id),
  searchGuests: (query: string): Promise<unknown[]> => ipcRenderer.invoke('db:searchGuests', query)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
