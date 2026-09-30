# jogo-burro

## Lógica do jogo

O motor fica isolado da interface em `src/game` e não depende de Vue, Ionic, rede ou bibliotecas externas. Ele suporta de 2 a 6 jogadores e usa um baralho padrão de 52 cartas, com quatro cartas distribuídas para cada participante.

### Troca e turnos

Os jogadores selecionam uma carta em ordem circular fixa. A carta escolhida fica reservada até todos selecionarem; ao finalizar a troca, cada carta vai ao próximo jogador e cada participante recebe a carta do jogador anterior. Isso mantém a troca simultânea sem duplicar cartas. Uma tentativa fora do turno ou com carta inválida retorna `{ ok: false, error }`.

Depois da troca, um jogador com quatro cartas do mesmo valor pode chamar `claimFourOfAKind`. A chamada vence a mão atual. Para manter a penalidade simples e determinística, o jogador imediatamente seguinte na ordem fixa recebe a próxima letra de `BURRO`. O motor redistribui as cartas e inicia outra mão.

A partida termina quando alguém recebe as cinco letras de `BURRO`; essa pessoa fica penalizada e o vencedor é escolhido entre os demais pelo menor número de letras, com desempate pela posição inicial. `GameResult.rounds` conta os ciclos completos de troca. A ordem cadastrada não muda durante a partida.

### Integração e privacidade

`GameEngine` expõe comandos de jogo e eventos por `subscribe`, além das interfaces `GameCommandPort` e `GameEventPort` para um adaptador Bluetooth futuro. O motor não implementa Bluetooth. Use `getState(playerId)` para obter um retrato que contém apenas a mão daquele jogador; as mãos adversárias e o baralho ficam ocultos. `getPlayerHand(playerId)` retorna a mão individual para a tela local.

### Testes

Com Node.js 24 ou superior, execute `npm test`. Os testes usam o executor nativo do Node e não requerem instalação de dependências.