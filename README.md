# Lanchonete Tray

Aplicação local para operação simples de uma lanchonete/restaurante, usando **Electron + Node.js + Express + Socket.IO + SQLite**.

O sistema abre um servidor local na rede e permite acessar telas separadas para mesa, balcão, cozinha, painel de pedidos e gerenciamento de cardápio/configurações.

> Status atual: projeto em estágio de MVP/protótipo funcional. Útil para demonstração e evolução, mas ainda precisa de ajustes antes de uso em produção.

---

## Funcionalidades

- Servidor local acessível pela rede local.
- App Electron em modo tray/ícone de bandeja.
- Cadastro e edição de categorias.
- Cadastro, ativação/desativação e exclusão controlada de produtos.
- Consulta de produto por código de barras via Open Food Facts.
- Consulta de CNPJ via BrasilAPI e CNPJ.ws.
- Cardápio para mesas com criação de pedidos.
- Telas operacionais para:
  - balcão;
  - cozinha;
  - painel de pedidos;
  - gerência;
  - cardápio;
  - configurações.
- Atualização em tempo real via Socket.IO.
- Persistência local em SQLite com `better-sqlite3`.

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
- Ambiente desktop compatível com Electron.

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

```bash
npm start
```

Ao iniciar, a aplicação:

1. cria/abre o banco SQLite em `data/lanchonete.db`;
2. inicia o servidor HTTP na porta `3000`;
3. expõe o servidor em `0.0.0.0`, permitindo acesso pela rede local;
4. cria um ícone na bandeja do sistema com opções de acesso.

Exemplo de URL local:

```text
http://localhost:3000
```

Em outro dispositivo na mesma rede, use o IP mostrado pelo tray da aplicação.

---

## Popular banco com dados de teste

Existe um script de seed para criar categorias e produtos de exemplo:

```bash
node seed.js
```

O script evita duplicar dados quando já existem categorias ou produtos cadastrados.

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
| `/painel` | Painel de pedidos |
| `/manager` | Área gerencial |
| `/manager/cardapio` | Gestão de cardápio |
| `/manager/configuracoes` | Configurações da loja |

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

## Estrutura do projeto

```text
.
├── main.js                  # Inicialização Electron, servidor Express e eventos Socket.IO
├── database.js              # Banco SQLite, tabelas, migrações simples e queries
├── seed.js                  # Dados iniciais de exemplo
├── package.json             # Dependências e scripts npm
├── package-lock.json        # Lockfile npm
├── public/
│   ├── index.html           # Home
│   ├── mesa.html            # Cardápio da mesa
│   ├── balcao.html          # Tela do balcão
│   ├── cozinha.html         # Tela da cozinha
│   ├── painel.html          # Painel de pedidos
│   ├── manager.html         # Área gerencial
│   ├── cardapio.html        # Gestão do cardápio
│   ├── configuracoes.html   # Configurações da loja
│   ├── layout-base.css      # Layout comum
│   ├── style.css            # Estilos principais
│   ├── theme-loader.js      # Carregamento de tema/configuração
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

## Pontos de atenção

Antes de usar em produção, este projeto precisa evoluir em alguns pontos:

- Não há autenticação/autorização nas telas administrativas.
- O servidor escuta em `0.0.0.0:3000`, expondo todas as rotas para a rede local.
- Não há suíte de testes automatizados.
- Não há scripts de lint, build ou empacotamento.
- A porta `3000` está fixa no código.
- Algumas telas HTML concentram muito CSS/JS inline, dificultando manutenção.
- `public/cardapio.html` e `public/configuracoes.html` estão atualmente idênticos, indicando provável cópia incompleta.
- O projeto usa `electron-rebuild`, pacote depreciado em favor de `@electron/rebuild`.
- `npm audit` aponta vulnerabilidades transitivas que devem ser avaliadas antes de distribuição.

---

## Scripts disponíveis

```bash
npm start
```

Inicia a aplicação Electron.

```bash
node seed.js
```

Popula o banco local com dados de exemplo.

---

## Licença

ISC
