export type MatchStatus = 'FINALIZADA' | 'CANCELADA' | 'INTERROMPIDA'

export type MatchEndReason =
  | 'VICTORY'
  | 'ABANDONMENT'
  | 'DISCONNECTION'
  | 'CANCELLATION'

export type LocalPlayerResult =
  | 'VENCEDOR'
  | 'PENALIZADO'
  | 'PARTICIPANTE'
  | 'CANCELADA'
  | 'INTERROMPIDA'

export interface MatchParticipant {
  id: string
  name: string
  order: number
}

export interface GameResult {
  id: string
  startedAt: string
  endedAt: string
  playerCount: number
  participants: MatchParticipant[]
  winnerId: string | null
  penalizedPlayerId: string | null
  localPlayerId: string
  rounds: number
  status: MatchStatus
  endReason: MatchEndReason
}

export interface MatchRecord extends GameResult {
  localResult: LocalPlayerResult
  savedAt: string
}

const DATABASE_NAME = 'burro-history'
const DATABASE_VERSION = 1
const MATCHES_STORE = 'matches'

export class DatabaseService {
  private databasePromise: Promise<IDBDatabase> | undefined

  constructor(private readonly indexedDBFactory?: IDBFactory) {}

  async saveMatch(match: MatchRecord): Promise<void> {
    const database = await this.openDatabase()
    await this.runWrite(database, (store) => store.put(match))
  }

  async getMatches(): Promise<MatchRecord[]> {
    const database = await this.openDatabase()
    const matches = await this.runRead<MatchRecord[]>(database, (store) => store.getAll())
    return matches.sort((left, right) => right.startedAt.localeCompare(left.startedAt))
  }

  async getMatchById(id: string): Promise<MatchRecord | undefined> {
    const database = await this.openDatabase()
    return this.runRead<MatchRecord | undefined>(database, (store) => store.get(id))
  }

  async deleteMatch(id: string): Promise<void> {
    const database = await this.openDatabase()
    await this.runWrite(database, (store) => store.delete(id))
  }

  async clearHistory(): Promise<void> {
    const database = await this.openDatabase()
    await this.runWrite(database, (store) => store.clear())
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      const factory = this.indexedDBFactory ?? globalThis.indexedDB
      if (!factory) return Promise.reject(new Error('IndexedDB não está disponível neste ambiente.'))

      this.databasePromise = new Promise((resolve, reject) => {
        const request = factory.open(DATABASE_NAME, DATABASE_VERSION)

        request.onupgradeneeded = () => {
          const database = request.result
          if (!database.objectStoreNames.contains(MATCHES_STORE)) {
            database.createObjectStore(MATCHES_STORE, { keyPath: 'id' })
          }
        }

        request.onsuccess = () => {
          request.result.onversionchange = () => request.result.close()
          resolve(request.result)
        }
        request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o histórico.'))
        request.onblocked = () => reject(new Error('A atualização do banco de histórico está bloqueada.'))
      }).catch((error: unknown) => {
        this.databasePromise = undefined
        throw error
      })
    }

    return this.databasePromise
  }

  private runRead<T>(
    database: IDBDatabase,
    requestFor: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(MATCHES_STORE, 'readonly')
      const request = requestFor(transaction.objectStore(MATCHES_STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Não foi possível consultar o histórico.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('A consulta ao histórico foi cancelada.'))
    })
  }

  private runWrite(
    database: IDBDatabase,
    requestFor: (store: IDBObjectStore) => IDBRequest,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(MATCHES_STORE, 'readwrite')
      requestFor(transaction.objectStore(MATCHES_STORE))
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível salvar o histórico.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('A gravação do histórico foi cancelada.'))
    })
  }
}