<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
} from '@ionic/vue'
import { historyRepository, type MatchRecord } from '../database'

const route = useRoute()
const router = useRouter()
const match = ref<MatchRecord>()
const errorMessage = ref('')

const endReasonLabels: Record<MatchRecord['endReason'], string> = {
  VICTORY: 'Vitória',
  ABANDONMENT: 'Abandono',
  DISCONNECTION: 'Desconexão',
  CANCELLATION: 'Cancelamento',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function participantName(playerId: string | null): string {
  return match.value?.participants.find((participant) => participant.id === playerId)?.name ?? 'Não definido'
}

async function loadMatch(): Promise<void> {
  const id = route.params.id
  if (typeof id !== 'string') {
    errorMessage.value = 'Identificador da partida inválido.'
    return
  }

  try {
    match.value = await historyRepository.getMatchById(id)
    if (!match.value) errorMessage.value = 'Esta partida não está mais no histórico.'
  } catch {
    errorMessage.value = 'Não foi possível carregar os detalhes da partida.'
  }
}

async function confirmDelete(): Promise<void> {
  if (!match.value) return

  const alert = await alertController.create({
    header: 'Excluir partida',
    message: 'Tem certeza que deseja excluir esta partida?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Excluir',
        role: 'destructive',
        handler: async () => {
          try {
            await historyRepository.deleteMatch(match.value!.id)
            await router.back()
          } catch {
            errorMessage.value = 'Não foi possível excluir esta partida.'
          }
        },
      },
    ],
  })
  await alert.present()
}

onMounted(loadMatch)
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButton slot="start" fill="clear" @click="router.back()">Voltar</IonButton>
        <IonTitle>Detalhes da partida</IonTitle>
        <IonButton slot="end" fill="clear" color="danger" :disabled="!match" @click="confirmDelete">
          Excluir
        </IonButton>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <p v-if="errorMessage" class="details-message" role="alert">{{ errorMessage }}</p>
      <IonList v-else-if="match" lines="full">
        <IonItem><IonLabel>Início</IonLabel><IonLabel slot="end">{{ formatDate(match.startedAt) }}</IonLabel></IonItem>
        <IonItem><IonLabel>Término</IonLabel><IonLabel slot="end">{{ formatDate(match.endedAt) }}</IonLabel></IonItem>
        <IonItem><IonLabel>Status</IonLabel><IonLabel slot="end">{{ match.status }}</IonLabel></IonItem>
        <IonItem><IonLabel>Motivo</IonLabel><IonLabel slot="end">{{ endReasonLabels[match.endReason] }}</IonLabel></IonItem>
        <IonItem><IonLabel>Vencedor</IonLabel><IonLabel slot="end">{{ participantName(match.winnerId) }}</IonLabel></IonItem>
        <IonItem><IonLabel>Jogador penalizado</IonLabel><IonLabel slot="end">{{ participantName(match.penalizedPlayerId) }}</IonLabel></IonItem>
        <IonItem><IonLabel>Rodadas</IonLabel><IonLabel slot="end">{{ match.rounds }}</IonLabel></IonItem>
        <IonItem><IonLabel>Resultado local</IonLabel><IonLabel slot="end">{{ match.localResult }}</IonLabel></IonItem>
        <IonItem>
          <IonLabel>
            <h2>Participantes e ordem</h2>
            <p v-for="participant in [...match.participants].sort((left, right) => left.order - right.order)" :key="participant.id">
              {{ participant.order }}. {{ participant.name }}
            </p>
          </IonLabel>
        </IonItem>
      </IonList>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.details-message {
  margin: 24px 16px;
  color: var(--ion-color-medium);
}
</style>