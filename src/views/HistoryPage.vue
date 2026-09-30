<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  alertController,
  onIonViewWillEnter,
} from '@ionic/vue'
import { historyRepository, type MatchRecord } from '../database'

const router = useRouter()
const matches = ref<MatchRecord[]>([])
const errorMessage = ref('')

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function participantName(match: MatchRecord, playerId: string | null): string {
  return match.participants.find((participant) => participant.id === playerId)?.name ?? 'Não definido'
}

async function loadMatches(): Promise<void> {
  try {
    matches.value = await historyRepository.getMatches()
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Não foi possível carregar o histórico neste dispositivo.'
  }
}

async function openMatch(match: MatchRecord): Promise<void> {
  await router.push({ name: 'match-details', params: { id: match.id } })
}

async function confirmClearHistory(): Promise<void> {
  if (matches.value.length === 0) return

  const alert = await alertController.create({
    header: 'Limpar histórico',
    message: 'Tem certeza que deseja excluir todo o histórico?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Excluir',
        role: 'destructive',
        handler: async () => {
          try {
            await historyRepository.clearHistory()
            await loadMatches()
          } catch {
            errorMessage.value = 'Não foi possível limpar o histórico.'
          }
        },
      },
    ],
  })
  await alert.present()
}

onIonViewWillEnter(loadMatches)
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Histórico</IonTitle>
        <IonButton slot="end" fill="clear" :disabled="matches.length === 0" @click="confirmClearHistory">
          Limpar
        </IonButton>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <p v-if="errorMessage" class="history-message" role="alert">{{ errorMessage }}</p>
      <p v-else-if="matches.length === 0" class="history-message">Nenhuma partida salva.</p>
      <IonList v-else>
        <IonItem
          v-for="match in matches"
          :key="match.id"
          button
          detail
          @click="openMatch(match)"
        >
          <IonLabel>
            <h2>{{ formatDate(match.startedAt) }} · {{ match.playerCount }} jogadores</h2>
            <p>Participantes: {{ match.participants.map((participant) => participant.name).join(', ') }}</p>
            <p>Vencedor: {{ participantName(match, match.winnerId) }} · Penalizado: {{ participantName(match, match.penalizedPlayerId) }}</p>
            <p>Resultado local: {{ match.localResult }} · {{ match.status }}</p>
          </IonLabel>
        </IonItem>
      </IonList>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.history-message {
  margin: 24px 16px;
  color: var(--ion-color-medium);
}
</style>