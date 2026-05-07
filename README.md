# Lanchonete Tray

Aplicação local/LAN para operação simples de uma lanchonete/restaurante, usando **Electron + Node.js + Express + Socket.IO + SQLite**.

O sistema inicia um servidor HTTP local e disponibiliza telas separadas para mesa, balcão, cozinha, painel de pedidos e área administrativa de cardápio/configurações.

> Status atual: MVP/protótipo funcional. Já serve para demonstração e validação em rede local, mas ainda precisa de autenticação, testes e empacotamento antes de uso em produção.

---

## Funcionalidades

- Servidor Express acessível pela rede local na porta `3000`.
- Modo Electron com tray/ícone de bandeja.
- Modo web-only para rodar apenas o servidor HTTP, sem abrir Electron.
- Cadastro e edição de categorias.
- Cadastro, ativação/desativação e exclusão controlada de produtos.
- Consulta de produto por código de barras via Open Food Facts.
- Consulta de CNPJ via BrasilAPI e CNPJ.ws.
- Cardápio para mesas com criação de pedidos.
- Telas operacionais:
  - início;
  - mesa;
  - balcão;
  - cozinha;
  - painel de acompanhamento;
  - manager;
  - cardápio administrativo;
  - configurações da loja.
- Atualização em tempo real via Socket.IO.
- Persistência local em SQLite com `better-sqlite3`.
- Tema configurável por loja, servido também via `/theme.css` para evitar flicker visual.
- Layout administrativo/operacional com sidebar/topbar compartilhadas via `layout-base.css` e `layout-shell.js`.

---

## Stack

- **Node.js**
- **Electron**
- **Express**
- **Socket.IO**
- **SQLite** com `better-sqlite3`
- HTML, CSS e JavaScript puro no frontend

---

## Requisitos

- Node.js e npm instalados.
- Ambiente desktop compatível com Electron, caso use `npm start`.

Testado localmente com:

```bash
node v22.22.1
npm 9.2.0
```

---

## Instalação

```bash
npm install
```

Ou, para instalar exatamente as versões do `package-lock.json`:

```bash
npm ci
```

---

## Executando

### Modo Electron

```bash
npm start
```

Ao iniciar em modo Electron, a aplicação:

1. cria/abre o banco SQLite em `data/lanchonete.db`;
2. inicia o servidor HTTP na porta `3000`;
3. expõe o servidor em `0.0.0.0`, permitindo acesso pela rede local;
4. cria um ícone na bandeja do sistema com opções de acesso.

### Modo web-only

Use quando quiser rodar somente o servidor HTTP, sem Electron:

```bash
npm run start:web
```

Também é possível iniciar diretamente:

```bash
node main.js --web-only
```

ou:

```bash
LANCHONETE_WEB_ONLY=1 node main.js
```

Exemplo de URL local:

```text
http://localhost:3000
```

Em outro dispositivo na mesma rede, use o IP da máquina onde o servidor está rodando.

---

## Popular banco com dados de teste

Existe um script de seed para criar categorias e produtos de exemplo:

```bash
node seed.js
```

O script evita duplicar dados quando já existem categorias ou produtos cadastrados.

Exemplo atual do seed:

- 4 categorias;
- 14 produtos.

---

## Rotas principais

### Telas

| Rota | Descrição |
| --- | --- |
| `/` | Tela inicial |
| `/mesa/:numero` | Cardápio da mesa |
| `/mesa/preview` | Preview da tela de mesa |
| `/balcao` | Atendimento/balcão |
| `/cozinha` | Fila da cozinha |
| `/painel` | Painel de acompanhamento dos pedidos |
| `/manager` | Área gerencial |
| `/manager/cardapio` | Gestão administrativa do cardápio |
| `/manager/configuracoes` | Configurações da loja |
| `/theme.css` | CSS dinâmico do tema configurado |

### API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/configuracoes` | Lista configurações |
| `POST` | `/api/configuracoes` | Salva configurações |
| `GET` | `/api/cnpj/:cnpj` | Consulta CNPJ |
| `GET` | `/api/categorias` | Lista categorias |
| `POST` | `/api/categorias` | Cria/atualiza categoria |
| `PATCH` | `/api/categorias/:id/status` | Ativa/desativa categoria |
| `GET` | `/api/produtos` | Lista produtos |
| `POST` | `/api/produtos` | Cria/atualiza produto |
| `PATCH` | `/api/produtos/:id/status` | Ativa/desativa produto |
| `DELETE` | `/api/produtos/:id` | Exclui produto quando não há histórico |
| `GET` | `/api/produtos/buscar-codigo/:codigo` | Consulta produto por código de barras |
| `GET` | `/api/pedidos` | Lista pedidos |
| `POST` | `/api/pedidos` | Cria pedido |
| `PATCH` | `/api/pedidos/:id/status` | Atualiza status do pedido |

---

## Layout e tema

O layout comum fica centralizado principalmente em:

```text
public/layout-base.css
public/layout-shell.js
public/theme-loader.js
```

Padrões atuais:

- telas operacionais/administrativas usam `.app-layout`, `.sidebar`, `.main-content`, `.top-bar` e `.content-area`;
- a sidebar é retrátil por hover;
- `/painel` usa comportamento especial para esconder a sidebar quase totalmente;
- `/mesa/:numero` mantém layout próprio de cliente/mesa;
- assets compartilhados devem usar caminho absoluto, por exemplo `/layout-base.css`, porque rotas como `/manager/cardapio` não resolvem corretamente caminhos relativos;
- `/theme.css` é servido pelo backend para aplicar as cores configuradas antes do JavaScript carregar.

---

## Estrutura do projeto

```text
.
├── main.js                  # Inicialização Electron/web-only, servidor Express e Socket.IO
├── database.js              # Banco SQLite, tabelas, migrações simples e queries
├── seed.js                  # Dados iniciais de exemplo
├── package.json             # Dependências e scripts npm
├── package-lock.json        # Lockfile npm
├── public/
│   ├── index.html           # Home
│   ├── mesa.html            # Cardápio da mesa/cliente
│   ├── balcao.html          # Tela do balcão
│   ├── cozinha.html         # Tela da cozinha
│   ├── painel.html          # Painel de acompanhamento
│   ├── manager.html         # Área gerencial
│   ├── cardapio.html        # Gestão administrativa do cardápio
│   ├── configuracoes.html   # Configurações da loja
│   ├── layout-base.css      # Layout comum/sidebar/topbar/tema base
│   ├── layout-shell.js      # Comportamento comum do layout/sidebar
│   ├── theme-loader.js      # Aplicação de tema/configuração no frontend
│   ├── style.css            # Estilos legados/complementares
│   └── img/                 # Ícones e imagens
└── data/                    # Banco SQLite local, ignorado pelo Git
```

---

## Banco de dados

O banco é criado automaticamente em:

```text
data/lanchonete.db
```

Tabelas principais:

- `pedidos`
- `pedido_itens`
- `configuracoes`
- `categorias`
- `produtos`

Arquivos `.db`, `.db-shm` e `.db-wal` ficam fora do versionamento via `.gitignore`.

---

## Publicação em LAN/proxy reverso

O servidor escuta em:

```text
0.0.0.0:3000
```

Para expor por proxy reverso, a configuração esperada é encaminhar HTTP para a máquina LAN onde o app roda:

```text
Scheme: http
Forward Hostname/IP: <IP-da-maquina>
Forward Port: 3000
Websockets: habilitado
```

Em ambientes com firewall, recomenda-se liberar a porta `3000` somente para o IP do proxy reverso.

---

## Scripts disponíveis

```bash
npm start
```

Inicia a aplicação Electron.

```bash
npm run start:web
```

Inicia apenas o servidor web/Express.

```bash
node seed.js
```

Popula o banco local com dados de exemplo.

---

## Pontos de atenção

Antes de usar em produção, este projeto precisa evoluir em alguns pontos:

- Não há autenticação/autorização nas telas administrativas.
- O servidor escuta em `0.0.0.0:3000`, expondo as rotas para a rede onde estiver liberado.
- Não há suíte de testes automatizados.
- Não há scripts de lint, build ou empacotamento.
- A porta `3000` está fixa no código.
- Algumas telas ainda concentram CSS/JS inline, dificultando manutenção.
- O projeto usa `electron-rebuild`, pacote depreciado em favor de `@electron/rebuild`.
- `npm audit` pode apontar vulnerabilidades transitivas que devem ser avaliadas antes de distribuição.

---


## Créditos

<p align="center">
  <img src="public/img/saga-system.jpg" alt="SAGA System" width="220" />
</p>

Desenvolvido por **SAGA System**.

**Desenvolvedores:**

- Matheus Jacobowski
- Matheus Garcia

**Localização:** Ibiporã - PR

---

## Licença

ISC
