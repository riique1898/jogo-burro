import {
  DatabaseService,
  type GameResult,
  type LocalPlayerResult,
  type MatchRecord,
} from './DatabaseService'

export class HistoryRepository {
  constructor(private readonly database: DatabaseService = new DatabaseService()) {}

  async saveMatch(result: GameResult): Promise<MatchRecord> {
    const match = this.createRecord(result)
    await this.database.saveMatch(match)
    return match
  }

  async saveGameResultAutomatically(result: GameResult): Promise<MatchRecord> {
    return this.saveMatch(result)
  }

  getMatches(): Promise<MatchRecord[]> {
    return this.database.getMatches()
  }

  getMatchById(id: string): Promise<MatchRecord | undefined> {
    return this.database.getMatchById(id)
  }

  deleteMatch(id: string): Promise<void> {
    return this.database.deleteMatch(id)
  }

  clearHistory(): Promise<void> {
    return this.database.clearHistory()
  }

  private createRecord(result: GameResult): MatchRecord {
    this.validate(result)

    let localResult: LocalPlayerResult
    if (result.status === 'CANCELADA') {
      localResult = 'CANCELADA'
    } else if (result.status === 'INTERROMPIDA') {
      localResult = 'INTERROMPIDA'
    } else if (result.winnerId === result.localPlayerId) {
      localResult = 'VENCEDOR'
    } else if (result.penalizedPlayerId === result.localPlayerId) {
      localResult = 'PENALIZADO'
    } else {
      localResult = 'PARTICIPANTE'
    }

    return {
      ...result,
      participants: result.participants.map((participant) => ({ ...participant })),
      localResult,
      savedAt: new Date().toISOString(),
    }
  }

  private validate(result: GameResult): void {
    if (!result.id.trim()) throw new Error('A partida precisa de um identificador.')
    if (!Number.isInteger(result.playerCount) || result.playerCount < 2 || result.playerCount > 6) {
      throw new Error('A partida precisa ter entre 2 e 6 jogadores.')
    }
    if (result.participants.length !== result.playerCount) {
      throw new Error('A quantidade de participantes não corresponde à partida.')
    }
    if (!Number.isInteger(result.rounds) || result.rounds < 0) {
      throw new Error('A quantidade de rodadas deve ser um inteiro não negativo.')
    }

    const startTime = Date.parse(result.startedAt)
    const endTime = Date.parse(result.endedAt)
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
      throw new Error('Os horários de início e término da partida são inválidos.')
    }

    const participantIds = new Set<string>()
    const orderPositions = new Set<number>()
    for (const participant of result.participants) {
      if (!participant.id.trim() || !participant.name.trim() || participantIds.has(participant.id)) {
        throw new Error('Os participantes precisam ter identificadores e nomes únicos.')
      }
      if (!Number.isInteger(participant.order) || participant.order < 1 || participant.order > result.playerCount || orderPositions.has(participant.order)) {
        throw new Error('A ordem dos participantes deve ser única e sequencial.')
      }
      participantIds.add(participant.id)
      orderPositions.add(participant.order)
    }

    if (!participantIds.has(result.localPlayerId)) {
      throw new Error('O jogador local precisa estar entre os participantes.')
    }
    if (result.winnerId && !participantIds.has(result.winnerId)) {
      throw new Error('O vencedor precisa estar entre os participantes.')
    }
    if (result.penalizedPlayerId && !participantIds.has(result.penalizedPlayerId)) {
      throw new Error('O jogador penalizado precisa estar entre os participantes.')
    }
    if (result.endReason === 'VICTORY' && (!result.winnerId || result.status !== 'FINALIZADA')) {
      throw new Error('Uma vitória precisa de vencedor e status FINALIZADA.')
    }
    if (result.status === 'CANCELADA' && result.endReason !== 'CANCELLATION') {
      throw new Error('Uma partida CANCELADA precisa do motivo CANCELLATION.')
    }
    if (result.status === 'INTERROMPIDA' && !['ABANDONMENT', 'DISCONNECTION'].includes(result.endReason)) {
      throw new Error('Uma partida INTERROMPIDA precisa de motivo ABANDONMENT ou DISCONNECTION.')
    }
  }
}