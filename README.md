Burro
Jogo mobile de cartas multiplayer local, planejado para partidas sem internet e comunicação entre celulares por Bluetooth.
Estado do projeto
O projeto possui os módulos de histórico/persistência, telas Ionic e o motor de lógica principal do jogo.
O motor do jogo fica isolado em src/game e não depende de Vue, Ionic, rede ou bibliotecas externas. A integração com Bluetooth ainda será feita por um adaptador separado.
O aplicativo completo com Vue/Ionic/Capacitor e a integração Bluetooth ainda estão em desenvolvimento.
Curso e unidades curriculares
Curso: Informática
Codificar acesso à web services e recursos de sistemas móveis
Codificar aplicações para dispositivos móveis
Integrantes
Henrique
Lucas
Zafalon
Repositório: riique1898/jogo-burro
Como o jogo funciona
O jogo utiliza um baralho padrão de 52 cartas e suporta de 2 a 6 jogadores.
Cada jogador recebe quatro cartas. A partida acontece em ciclos de troca de cartas entre os participantes.
Distribuição
No início de cada mão, quatro cartas são distribuídas para cada jogador.
A ordem dos jogadores é definida no início da partida e permanece fixa durante todo o jogo.
Troca e turnos
Os jogadores selecionam uma carta seguindo uma ordem circular.
A carta selecionada fica reservada até que todos os jogadores tenham escolhido.
Após todos realizarem a escolha, as cartas são trocadas simultaneamente: cada jogador recebe a carta escolhida pelo jogador anterior na ordem.
Esse sistema evita duplicação de cartas durante a troca.
Tentativas inválidas, como selecionar uma carta inexistente ou realizar uma ação fora do turno, retornam um erro.
Quatro cartas iguais
Quando um jogador possui quatro cartas do mesmo valor, ele pode utilizar o comando claimFourOfAKind.
Essa ação encerra a mão atual.
Como penalidade, o jogador imediatamente seguinte na ordem fixa recebe a próxima letra de BURRO.
Depois disso, as cartas são redistribuídas e uma nova mão começa.
Fim da partida
A partida termina quando um dos jogadores recebe as cinco letras de BURRO.
Esse jogador fica penalizado.
O vencedor é definido entre os demais jogadores considerando a menor quantidade de letras acumuladas. Em caso de empate, é utilizada a posição inicial dos jogadores como critério de desempate.
GameResult.rounds registra a quantidade de ciclos completos de troca realizados durante a partida.
Motor do jogo
O motor principal está localizado em:
src/game
O GameEngine disponibiliza comandos e eventos para controlar a partida.
A comunicação é organizada por meio das interfaces:
GameCommandPort
GameEventPort
O motor também permite inscrição de jogadores por:
subscribe(playerId, listener)
O motor não implementa Bluetooth diretamente. A comunicação Bluetooth deverá ser adicionada futuramente por meio de um adaptador.
Privacidade dos jogadores
As informações enviadas pelo motor são separadas por jogador.
Eventos card-received são enviados somente para o jogador que recebeu a carta.
Eventos relacionados à troca informam o remetente e o destinatário, mas não revelam qual carta foi enviada.
Para consultar o estado individual de um jogador:
getState(playerId)
Esse estado contém somente a mão daquele jogador. As mãos dos adversários e o restante do baralho permanecem ocultos.
Também é possível consultar a mão local utilizando:
getPlayerHand(playerId)
No futuro, o adaptador Bluetooth deverá associar cada identificador de jogador a um dispositivo autenticado antes de permitir comandos ou inscrições em eventos.
Histórico e persistência
O projeto possui uma base para o recurso de histórico em:
src/database/
Também existem telas relacionadas ao histórico em:
src/views/
O armazenamento utiliza IndexedDB, disponível localmente no WebView do Capacitor, sem necessidade de um serviço remoto.
O histórico possui suporte para:
partidas concluídas;
partidas canceladas;
partidas interrompidas;
participantes;
horários;
ordem dos jogadores;
resultado;
motivo do encerramento;
quantidade de rodadas.
O contrato de integração e o esquema estão documentados em:
docs/history.md
Ao finalizar uma partida, o motor deverá utilizar:
historyRepository.saveGameResultAutomatically(result)
para registrar automaticamente o resultado.
Essa integração entre o motor e o histórico ainda precisa ser concluída e validada no aplicativo.
Bluetooth
A comunicação entre os celulares será realizada futuramente utilizando Bluetooth Low Energy (BLE).
O fluxo planejado é:
Um jogador cria a partida.
Os outros jogadores encontram a partida localmente.
Os dispositivos estabelecem conexão Bluetooth.
Os jogadores recebem seus identificadores.
O motor controla a distribuição e as trocas.
Os eventos são enviados para os dispositivos correspondentes.
Ao final da partida, o resultado é armazenado no histórico.
O motor de jogo permanece independente do Bluetooth para facilitar testes e manutenção.
Como jogar
Quando a integração estiver concluída, o fluxo previsto será:
Abrir o aplicativo.
Criar uma partida.
Permitir que os outros jogadores entrem.
Conectar os dispositivos por Bluetooth.
Iniciar a partida.
Receber as cartas.
Realizar as trocas.
Utilizar a ação de quatro cartas iguais quando aplicável.
Continuar as rodadas até o encerramento.
Consultar o resultado no histórico.
Como contribuir
Clone o repositório:
git clone https://github.com/riique1898/jogo-burro.git
Entre na pasta:
cd jogo-burro
Crie uma branch para sua tarefa:
git switch -c feat/nome-da-tarefa
Desenvolva e valide as alterações.
Faça commits pequenos e descritivos:
git add <arquivos>
git commit -m "tipo: descreve a alteração"
Envie a branch:
git push -u origin feat/nome-da-tarefa
Abra um Pull Request para a branch principal e descreva as alterações realizadas e os testes executados.
Como instalar, executar e testar
O aplicativo completo ainda está em desenvolvimento.
O motor de jogo pode ser testado separadamente utilizando Node.js 24 ou superior.
Para executar os testes:
npm test
Os testes do motor utilizam o executor nativo do Node.js e não dependem de bibliotecas externas.
A execução completa em celulares ainda depende da conclusão do scaffold Vue/Ionic/Capacitor e da integração Bluetooth.
Testes de aceitação
Após a integração do aplicativo, os testes deverão verificar:
Criar uma partida.
Conectar os jogadores por Bluetooth.
Distribuir as cartas.
Realizar as trocas.
Verificar a condição de quatro cartas iguais.
Verificar a penalização com as letras de BURRO.
Verificar o encerramento da partida.
Salvar automaticamente o resultado no histórico.
Fechar e abrir novamente o aplicativo.
Confirmar que a partida permanece no histórico.
Abrir os detalhes da partida.
Cancelar uma exclusão e verificar que o registro permanece.
Excluir uma partida e confirmar que ela desaparece.
Testar partidas canceladas e interrompidas por abandono ou desconexão.
Testar a função de limpeza completa do histórico.
Limitações conhecidas
A integração Bluetooth ainda está em desenvolvimento.
O aplicativo completo Vue/Ionic/Capacitor ainda precisa ser finalizado.
A integração automática entre o motor e o histórico ainda precisa ser conectada.
O IndexedDB armazena os dados localmente no dispositivo e não possui sincronização com servidor.
Os dados podem ser removidos ao limpar os dados do aplicativo ou desinstalá-lo.
O funcionamento em dispositivos físicos ainda precisa ser validado.
O adaptador Bluetooth deverá realizar a autenticação e associação dos jogadores aos dispositivos.
O histórico depende da integração com o motor para realizar o salvamento automático.
Checklist
 Estrutura inicial do projeto
 Módulos de histórico
 Persistência com IndexedDB
 Motor de lógica do jogo
 Distribuição de cartas
 Turnos
 Troca de cartas
 Condição de quatro cartas iguais
 Penalidade BURRO
 Condição de encerramento
 Proteção dos dados entre jogadores
 Criação de partida no aplicativo
 Entrada de jogadores
 Integração Bluetooth
 Integração do motor com o histórico
 Testes em dispositivos físicos
 Finalização das telas do aplicativo
 Prints e GIFs da aplicação funcionando
Prints e GIFs
Capturas de tela e GIFs serão adicionados após a integração das telas ao aplicativo e a execução dos fluxos em dispositivos.
 
Histórico	Detalhes da partida	Jogo em andamento
A adicionar	A adicionar	A adicionar