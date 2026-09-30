# Burro

Jogo mobile de cartas multiplayer local, planejado para partidas sem internet e comunicação entre celulares por Bluetooth.

> **Estado do repositório:** a branch contém os módulos TypeScript do histórico e as telas Ionic isoladas. O projeto ainda não possui `package.json`, aplicação Vue/Ionic inicializável, roteador, motor de cartas ou integração Bluetooth; por isso as telas ainda não estão acessíveis dentro de um aplicativo e os fluxos abaixo não foram executados em celulares.

## Curso e unidades curriculares

- **Curso:** não informado no enunciado recebido; confirmar com a turma antes da entrega.
- Codificar acesso à web services e recursos de sistemas móveis
- Codificar aplicações para dispositivos móveis

## Integrantes

- Henrique — perfil do GitHub não informado.
- Lucas — perfil do GitHub não informado.
- Zafalon — perfil do GitHub não informado. Repositório do projeto: [riique1898/jogo-burro](https://github.com/riique1898/jogo-burro).

Os perfis pessoais não foram inferidos a partir do repositório para evitar associar links à pessoa errada.

## Como o jogo funciona

O fluxo abaixo é o escopo planejado, não uma descrição de funcionalidades já executáveis. A variante exata das regras das cartas ainda precisa ser confirmada pela equipe.

1. Um jogador cria a partida no celular e os demais entram nela localmente.
2. Os celulares descobrem e conectam os participantes por Bluetooth Low Energy, sem servidor ou internet.
3. A partida define a ordem e distribui as cartas de acordo com as regras que a equipe validar.
4. Nos turnos, os jogadores fazem as trocas permitidas pela variante definida.
5. O objetivo, a condição de vitória e a penalização devem seguir as regras aprovadas para o projeto; o motor ainda não está neste repositório.
6. Ao terminar, cancelar, abandonar ou perder a conexão, a partida deverá produzir um resultado para o histórico.

## Como jogar

Quando o jogo estiver integrado, o fluxo previsto será: abrir o aplicativo, criar uma partida em um celular, permitir que os outros jogadores entrem, aguardar a conexão Bluetooth, iniciar a distribuição, jogar os turnos e consultar o resultado. Ainda não é possível jogar com este repositório, pois a criação de partidas, as cartas, os turnos e o Bluetooth não foram implementados.

## Histórico e persistência

Foi criada uma base do recurso em `src/database/` e duas telas Ionic em `src/views/`. O armazenamento usa IndexedDB, disponível localmente no WebView do Capacitor, sem serviço remoto. A tela de detalhes e os alertas de exclusão existem como componentes, mas precisam ser registrados no roteador do aplicativo para ficarem acessíveis. O contrato de integração e o esquema estão em [docs/history.md](docs/history.md).

O motor deve chamar `historyRepository.saveGameResultAutomatically(result)` ao encerrar uma partida, incluindo cancelamentos e interrupções. Essa chamada ainda não está conectada a um motor neste repositório; portanto o salvamento automático durante uma partida não pode ser exercitado aqui.

## Como contribuir

1. Clone o repositório: `git clone https://github.com/riique1898/jogo-burro.git`.
2. Entre na pasta: `cd jogo-burro`.
3. Crie uma branch para sua tarefa: `git switch -c feat/nome-da-tarefa`.
4. Desenvolva e valide as alterações no ambiente do projeto, quando o scaffold estiver disponível.
5. Faça commits pequenos e descritivos: `git add <arquivos>` e `git commit -m "tipo: descreve a alteração"`.
6. Envie a branch: `git push -u origin feat/nome-da-tarefa`.
7. Abra um Pull Request para a branch principal e descreva alterações e testes realizados.

## Como instalar, executar e testar

No estado atual não há `package.json`, configuração Capacitor ou aplicativo compilável; assim, não existe comando de instalação/execução válido e não é possível conectar dois celulares nem jogar. Quando o scaffold Vue/Ionic for incorporado, os testes de aceitação deverão seguir esta sequência:

1. Instalar as dependências declaradas pelo aplicativo e executá-lo nos dois celulares.
2. Criar a partida em um aparelho, descobrir/conectar o segundo por Bluetooth e iniciar o jogo.
3. Concluir uma partida e verificar seu registro na tela de histórico.
4. Fechar totalmente e abrir novamente o aplicativo; confirmar que a partida ainda aparece.
5. Abrir os detalhes e conferir horários, participantes, ordem, resultado, motivo e rodadas.
6. Iniciar a exclusão individual e tocar em **Cancelar**; confirmar que a partida permanece.
7. Excluir a partida e confirmar que ela desaparece.
8. Criar registros para partidas canceladas e interrompidas por abandono/desconexão.
9. Usar **Limpar histórico**, cancelar a confirmação e verificar que os registros permanecem; confirmar em um teste separado que a limpeza remove todos.

Essa sequência ainda não foi executada: falta o aplicativo hospedeiro, o motor de jogo e a integração Bluetooth. Não há testes automatizados configurados neste repositório.

## Limitações conhecidas

- O repositório contém somente o README original e os módulos/telas de histórico desta branch; falta o scaffold executável Vue/Ionic/Capacitor e a configuração de rotas.
- IndexedDB persiste no dispositivo entre aberturas do app, mas os dados podem ser removidos ao limpar os dados do aplicativo ou desinstalá-lo. Não há sincronização ou cópia de segurança.
- O salvamento depende de o motor chamar o contrato do repositório ao encerrar cada partida; essa integração ainda não existe.
- As regras de distribuição, troca, vitória e penalização, assim como Bluetooth e teste em dispositivos, não foram implementados nem verificados.
- Nome oficial do curso e perfis pessoais dos integrantes precisam ser fornecidos pela equipe.

## Checklist

- [ ] Identificação
- [ ] Criação de partida
- [ ] Entrada de jogador
- [ ] Bluetooth
- [ ] Distribuição
- [ ] Turnos
- [ ] Troca
- [ ] Vitória
- [ ] Penalidade
- [ ] Histórico integrado ao aplicativo
- [ ] Persistência integrada e testada após reiniciar

## Prints e GIFs

Capturas e GIFs serão adicionados quando as telas estiverem montadas no aplicativo e puderem ser executadas.

| Histórico | Detalhes da partida | Jogo em andamento |
| --- | --- | --- |
| A adicionar | A adicionar | A adicionar |