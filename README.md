# Lanchonete Tray

Projeto de demonstração de uma aplicação Electron/Node para gerenciar uma lanchonete com interface web. Possui páginas públicas HTML/CSS/JS integradas com um backend Express e uma janela Electron.

## Tecnologias
- Node.js + npm
- Electron
- Express
- Socket.IO
- better-sqlite3

## Como começar
1) Requisitos
- Node.js e npm instalados (recomendado >= 18.x)
- Windows: ferramentas de build para módulos nativos (Visual Studio Build Tools + Python) podem ser necessárias para `better-sqlite3`.

2) Instalação
```
npm install
```

3) Executando
```
npm start
```

Se houver erro relacionado a módulo nativo/ABI (ex.: `better-sqlite3`), rode:
```
npm run rebuild
npm start
```

Observação: a aplicação roda como ícone de bandeja do sistema. Use o menu do tray para abrir o painel no navegador.

## Estrutura do projeto
- database.js
- main.js
- package.json
- SETUP_VISUAL.md
- data/
- public/
  - balcao.html
  - cardapio.html
  - configuracoes.html
  - cozinha.html
  - index.html
  - layout-base.css
  - manager.html
  - mesa.html
  - painel.html
  - style.css
  - template.html
  - theme-loader.js

## Como contribuir
- Crie issues para solicitar recursos ou relatar bugs.
- Sinta-se à vontade para enviar pull requests com melhorias no código, documentação ou testes.

## Licença
ISC