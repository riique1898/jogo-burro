# Persistência e histórico

## Arquitetura

- `src/database/DatabaseService.ts`: abre o banco IndexedDB e implementa operações locais de leitura e gravação.
- `src/database/HistoryRepository.ts`: valida `GameResult`, calcula o resultado local e expõe operações para a interface.
- `src/database/index.ts`: exporta os tipos e uma instância compartilhada de `historyRepository`.
- `src/views/HistoryPage.vue`: lista partidas e pede confirmação antes de limpar o histórico.
- `src/views/MatchDetailsPage.vue`: mostra os detalhes e pede confirmação antes de excluir uma partida.

Os componentes chamam o repositório; não contêm acesso direto ao banco. As telas aguardam integração ao roteador Vue/Ionic: a rota de detalhes deve usar o nome `match-details` e receber o parâmetro `id`.

## Banco e relacionamento

Banco IndexedDB `burro-history`, versão `1`, com um object store `matches` cuja chave é `id`. Cada partida é um registro independente e contém seu array de participantes embutido. Essa estrutura evita tabela de junção para o volume pequeno do histórico e não exige plugin ou conexão de rede. Atualizações usam a versão do banco para migrações futuras.

| Campo | Tipo TypeScript / IndexedDB | Descrição |
| --- | --- | --- |
| `id` | `string` / chave | Identificador único da partida. |
| `startedAt`, `endedAt` | `string` (ISO 8601) | Início e término. |
| `playerCount` | `number` | Quantidade de participantes, de 2 a 6. |
| `participants` | `MatchParticipant[]` | Participantes embutidos, com `id`, `name` e `order`. |
| `winnerId` | `string \| null` | ID do vencedor, se houver. |
| `penalizedPlayerId` | `string \| null` | ID do jogador penalizado, se houver. |
| `localPlayerId` | `string` | ID do jogador deste dispositivo. |
| `rounds` | `number` | Total de rodadas, inteiro não negativo. |
| `status` | `MatchStatus` | `FINALIZADA`, `CANCELADA` ou `INTERROMPIDA`. |
| `endReason` | `MatchEndReason` | `VICTORY`, `ABANDONMENT`, `DISCONNECTION` ou `CANCELLATION`. |
| `localResult` | `LocalPlayerResult` | `VENCEDOR`, `PENALIZADO`, `PARTICIPANTE`, `CANCELADA` ou `INTERROMPIDA`. |
| `savedAt` | `string` (ISO 8601) | Horário em que o registro foi persistido. |

`participants.order` define a ordem da partida. Os IDs de vencedor, penalizado e jogador local referenciam `participants[].id`. Não há relacionamento com Bluetooth nem com dados remotos.

## Operações

- `saveMatch(result)`: valida e persiste um registro (mesmo ID atualiza o existente).
- `getMatches()`: consulta todos e ordena do mais recente para o mais antigo.
- `getMatchById(id)`: consulta um registro pela chave.
- `deleteMatch(id)`: exclui um registro.
- `clearHistory()`: exclui todos os registros.
- `saveGameResultAutomatically(result)`: entrada para o motor persistir o resultado ao término da partida. O motor ainda precisa chamar esta função.

O banco tem persistência local no WebView e não depende de internet. Desinstalar o app ou limpar seus dados pode apagar o histórico. Não existe exportação, backup ou sincronização.

## Contrato com o motor

O motor deve formar um objeto `GameResult` com os campos descritos e enviar estados terminais. Exemplo do caso de desconexão:

```ts
await historyRepository.saveGameResultAutomatically({
  id: matchId,
  startedAt,
  endedAt: new Date().toISOString(),
  playerCount: participants.length,
  participants,
  winnerId: null,
  penalizedPlayerId: null,
  localPlayerId,
  rounds,
  status: 'INTERROMPIDA',
  endReason: 'DISCONNECTION',
})
```

Use `CANCELADA` com `CANCELLATION` para cancelamento e `INTERROMPIDA` com `ABANDONMENT` para abandono. Uma vitória usa `FINALIZADA`, `VICTORY` e `winnerId`. O repositório não observa eventos Bluetooth e não decide regras: a chamada deve ocorrer no ponto de encerramento do motor.

## Verificação pendente

Este repositório ainda não possui aplicativo Vue/Ionic, dependências, roteador, motor ou configuração de testes. Portanto, não foi possível executar testes de persistência entre sessões, interface, exclusão, cancelamento ou desconexão em navegador/celular. Ao integrar o scaffold, adicionar testes com IndexedDB real ou uma implementação compatível e validar os dez fluxos listados no README.