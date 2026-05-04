# 🎨 Guia de Setup Visual - Sistema Unificado

## ✅ O que foi implementado

Seu projeto agora possui um **sistema visual padronizado com sidebar reutilizável** em todas as telas principais e **cores dinâmicas** configuráveis pelo cliente.

### 📁 Arquivos Criados

1. **`layout-base.css`** - CSS base com:
   - Layout padrão com sidebar (270px)
   - Sistema de cores via variáveis CSS
   - Componentes reutilizáveis (buttons, cards, badges)
   - Tipografia consistente
   - Responsividade

2. **`theme-loader.js`** - Carrega cores do banco de dados:
   - Busca configurações via `/api/configuracoes`
   - Aplica cores dinamicamente
   - Fallback para cores padrão
   - Suporta atualização em tempo real

3. **`template.html`** - Template de exemplo:
   - Mostra como usar o novo layout
   - Demonstra componentes disponíveis
   - Base para criar novas telas

### 🔄 Arquivos Atualizados

#### Telas com Novo Layout (Sidebar + Cores Dinâmicas)
- ✅ **index.html** - Página inicial com cards de estatísticas
- ✅ **balcao.html** - Cards de pedidos com grid responsivo
- ✅ **cozinha.html** - Fila de cozinha com cards coloridos
- ✅ **painel.html** - Painel em 2 colunas (Preparando/Pronto)

#### Telas de Gerenciamento (Mantidas como estavam)
- `manager.html` - Já tinha layout próprio, permanece funcional
- `configuracoes.html` - Formulário para editar cores e dados da loja
- `cardapio.html` - Gerenciador de cardápio
- `mesa.html` - Interface do cliente (tablet)

---

## 🎯 Como Usar

### Estrutura de Uma Página

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <!-- Fontes -->
    <link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- CSS Base -->
    <link rel="stylesheet" href="layout-base.css">
</head>
<body>
    <!-- LAYOUT COM SIDEBAR -->
    <div class="app-layout">
        <!-- SIDEBAR -->
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-icon">🍔</div>
                <h1>Lanchonete</h1>
            </div>
            
            <nav class="nav-menu">
                <a href="/balcao" class="nav-item active">
                    <span class="nav-item-icon">💳</span>
                    <span>Balcão</span>
                </a>
            </nav>
        </aside>

        <!-- CONTEÚDO PRINCIPAL -->
        <main class="main-content">
            <div class="top-bar">
                <h2 class="top-bar-title">Título da Página</h2>
                <div class="top-bar-actions">
                    <span id="hora">00:00</span>
                </div>
            </div>

            <div class="content-area">
                <!-- Seu conteúdo aqui -->
            </div>
        </main>
    </div>

    <!-- Script de Tema -->
    <script src="theme-loader.js"></script>
</body>
</html>
```

### Componentes Disponíveis

#### Botões
```html
<button class="btn btn-primary">Botão Principal</button>
<button class="btn btn-secondary">Botão Secundário</button>
<button class="btn btn-outline">Botão Outline</button>
```

#### Cards
```html
<div class="card">
    <div class="card-header">
        <h3>Título do Card</h3>
    </div>
    <p>Conteúdo do card</p>
</div>
```

#### Badges
```html
<span class="badge badge-primary">Primário</span>
<span class="badge badge-success">Sucesso</span>
<span class="badge badge-warning">Aviso</span>
<span class="badge badge-info">Info</span>
```

#### Grid
```html
<div class="grid grid-3">
    <div class="card">Item 1</div>
    <div class="card">Item 2</div>
    <div class="card">Item 3</div>
</div>
```

---

## 🎨 Variáveis de Cor

Disponíveis no `:root`:

```css
--cor-primaria      /* Cor principal (red) */
--cor-secundaria    /* Cor da sidebar (dark) */
--cor-destaque      /* Cor de destaque (yellow) */
--fundo             /* Fundo geral */
--card              /* Fundo dos cards */
--texto             /* Cor do texto */
--muted             /* Cor de texto muted */
--borda             /* Cor das bordas */
```

### Alterando Cores via JavaScript

```javascript
const root = document.documentElement;
root.style.setProperty('--cor-primaria', '#2563eb');
root.style.setProperty('--cor-secundaria', '#1e293b');
```

---

## 🔧 Configuração de Cores

### 1. Editar via Interface

1. Acesse **Manager** → **Configurações**
2. Altere as cores usando os seletores de cor
3. Clique em **Salvar Configurações**
4. As cores são aplicadas em tempo real em todas as telas

### 2. Cores Armazenadas no Banco

As cores são guardadas em `configuracoes` tabela com chaves:
- `tema.corPrimaria`
- `tema.corSecundaria`
- `tema.corDestaque`

### 3. Carregamento Automático

Cada página carrega as cores automaticamente via:
```javascript
fetch('/api/configuracoes')
```

---

## 📱 Responsividade

Todas as telas são responsivas:

- **Desktop**: Sidebar 270px + Conteúdo
- **Tablet**: Sidebar desaparece, conteúdo fullwidth
- **Mobile**: Interface completa mobile-first

### Desabilitar Sidebar

Para telas sem sidebar:
```html
<div class="app-layout sem-sidebar">
    <!-- Sem sidebar -->
</div>
```

---

## 🚀 Próximas Melhorias

Sugestões para evoluir ainda mais:

1. **Tema Escuro**: Adicionar toggle dark mode
2. **Mais Temas**: Pré-definidos (pastel, vibrante, minimalista)
3. **Upload de Logo**: Permitir upload de logo da empresa
4. **Presets**: Combinações pré-definidas de cores
5. **Fonte Customizável**: Permitir mudar fontes
6. **Espaçamento**: Ajustar tamanhos de padding/margin

---

## 🐛 Troubleshooting

### Cores não estão aplicando?
- Verifique se `theme-loader.js` está sendo carregado
- Abra o DevTools (F12) e veja o console
- Certifique-se que `/api/configuracoes` retorna dados

### Sidebar desaparece em mobile?
- Isso é esperado na breakpoint 768px
- Use `sem-sidebar` class para desabilitar sempre

### Componentes não parecem certos?
- Verifique se `layout-base.css` está linkado
- Cheque as classes CSS (case-sensitive)
- Inspecione no DevTools para debug

---

## 📞 Suporte

Para dúvidas sobre o novo sistema:
1. Consulte este guia
2. Veja o `template.html` para exemplos
3. Inspecione as telas já atualizadas (balcao.html, cozinha.html, etc)
