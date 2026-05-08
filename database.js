const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, "lanchonete.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function criarTabelasSeNaoExistirem() {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_mesa INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'preparando',
            observacao TEXT,
            total_centavos INTEGER NOT NULL DEFAULT 0,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS table_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            restaurant_id INTEGER,
            table_number TEXT NOT NULL,
            session_hash TEXT NOT NULL,
            public_id TEXT NOT NULL UNIQUE,
            device_id TEXT,
            status TEXT NOT NULL DEFAULT 'open',
            opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            closed_at TEXT,
            last_seen TEXT,
            meta_json TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            produto_id INTEGER,
            nome_produto TEXT NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 1,
            preco_unitario_centavos INTEGER NOT NULL DEFAULT 0,
            total_centavos INTEGER NOT NULL DEFAULT 0,
            observacao TEXT,

            FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
            FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS configuracoes (
            chave TEXT PRIMARY KEY,
            valor TEXT
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ordem INTEGER NOT NULL DEFAULT 0,
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria_id INTEGER,
            codigo_barras TEXT,
            nome TEXT NOT NULL,
            marca TEXT,
            descricao TEXT,
            preco_centavos INTEGER NOT NULL DEFAULT 0,
            imagem_url TEXT,
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        )
    `).run();
}

function colunaExiste(tabela, coluna) {
    const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all();
    return colunas.some((item) => item.name === coluna);
}

function aplicarMigracoesSimples() {
    if (!colunaExiste("pedidos", "observacao")) {
        db.prepare(`
            ALTER TABLE pedidos
            ADD COLUMN observacao TEXT
        `).run();
    }

    if (!colunaExiste("pedidos", "total_centavos")) {
        db.prepare(`
            ALTER TABLE pedidos
            ADD COLUMN total_centavos INTEGER NOT NULL DEFAULT 0
        `).run();
    }

    if (!colunaExiste("pedido_itens", "produto_id")) {
        db.prepare(`
            ALTER TABLE pedido_itens
            ADD COLUMN produto_id INTEGER
        `).run();
    }

    if (!colunaExiste("pedido_itens", "observacao")) {
        db.prepare(`
            ALTER TABLE pedido_itens
            ADD COLUMN observacao TEXT
        `).run();
    }

    if (!colunaExiste("produtos", "codigo_barras")) {
        db.prepare(`
            ALTER TABLE produtos
            ADD COLUMN codigo_barras TEXT
        `).run();
    }

    if (!colunaExiste("produtos", "marca")) {
        db.prepare(`
            ALTER TABLE produtos
            ADD COLUMN marca TEXT
        `).run();
    }

    if (!colunaExiste("produtos", "imagem_url")) {
        db.prepare(`
            ALTER TABLE produtos
            ADD COLUMN imagem_url TEXT
        `).run();
    }

    if (!colunaExiste("produtos", "atualizado_em")) {
        db.prepare(`
            ALTER TABLE produtos
            ADD COLUMN atualizado_em TEXT
        `).run();
    }

    if (!colunaExiste("categorias", "atualizado_em")) {
        db.prepare(`
            ALTER TABLE categorias
            ADD COLUMN atualizado_em TEXT
        `).run();
    }
}

criarTabelasSeNaoExistirem();
aplicarMigracoesSimples();

function limparTexto(valor) {
    return String(valor || "").trim();
}

function limparCnpj(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function limparCodigoBarras(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function normalizarEstado(valor) {
    return limparTexto(valor).toUpperCase().slice(0, 2);
}

function normalizarAtivo(valor) {
    return valor === false || valor === 0 || valor === "0" ? 0 : 1;
}

function normalizarCentavos(valor) {
    if (typeof valor === "number" && Number.isInteger(valor)) {
        return Math.max(0, valor);
    }

    const texto = String(valor || "")
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();

    const numero = Number(texto);

    if (!Number.isFinite(numero)) {
        return 0;
    }

    return Math.max(0, Math.round(numero * 100));
}

function calcularTotalItens(itens) {
    return itens.reduce((total, item) => {
        const quantidade = Number(item.quantidade || 1);
        const precoUnitario = Number(
            item.preco_unitario_centavos ||
            item.precoCentavos ||
            item.precoUnitarioCentavos ||
            0
        );

        return total + quantidade * precoUnitario;
    }, 0);
}

// -----------------------------
// Configurações
// -----------------------------

function obterConfiguracoes() {
    const rows = db.prepare(`
        SELECT chave, valor
        FROM configuracoes
    `).all();

    const config = {};

    for (const row of rows) {
        config[row.chave] = row.valor;
    }

    return {
        loja: {
            nomeFantasia: config["loja.nomeFantasia"] || "",
            razaoSocial: config["loja.razaoSocial"] || "",
            cnpj: config["loja.cnpj"] || "",
            telefone: config["loja.telefone"] || "",
            whatsapp: config["loja.whatsapp"] || "",
            email: config["loja.email"] || "",
            endereco: config["loja.endereco"] || "",
            cidade: config["loja.cidade"] || "",
            estado: config["loja.estado"] || "",
            logoUrl: config["loja.logoUrl"] || ""
        },
        tema: {
            corPrimaria: config["tema.corPrimaria"] || "#e11d48",
            corSecundaria: config["tema.corSecundaria"] || "#111827",
            corDestaque: config["tema.corDestaque"] || "#f59e0b"
        },
        suporte: {
            empresa: "Sua Empresa Sistemas",
            texto: "Sistema de atendimento local para restaurantes e lanchonetes.",
            whatsapp: "5547999999999",
            email: "suporte@suaempresa.com"
        }
    };
}

function salvarConfiguracoes(config) {
    const salvar = db.prepare(`
        INSERT INTO configuracoes (chave, valor)
        VALUES (?, ?)
        ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
    `);

    const loja = config.loja || {};
    const tema = config.tema || {};

    const campos = {
        "loja.nomeFantasia": limparTexto(loja.nomeFantasia),
        "loja.razaoSocial": limparTexto(loja.razaoSocial),
        "loja.cnpj": limparCnpj(loja.cnpj),
        "loja.telefone": limparTexto(loja.telefone),
        "loja.whatsapp": limparTexto(loja.whatsapp),
        "loja.email": limparTexto(loja.email),
        "loja.endereco": limparTexto(loja.endereco),
        "loja.cidade": limparTexto(loja.cidade),
        "loja.estado": normalizarEstado(loja.estado),
        "loja.logoUrl": limparTexto(loja.logoUrl),

        "tema.corPrimaria": tema.corPrimaria || "#e11d48",
        "tema.corSecundaria": tema.corSecundaria || "#111827",
        "tema.corDestaque": tema.corDestaque || "#f59e0b"
    };

    const transaction = db.transaction(() => {
        for (const [chave, valor] of Object.entries(campos)) {
            salvar.run(chave, String(valor));
        }
    });

    transaction();

    return obterConfiguracoes();
}

// -----------------------------
// Categorias
// -----------------------------

function listarCategorias({ somenteAtivas = false } = {}) {
    const where = somenteAtivas ? "WHERE ativo = 1" : "";

    return db.prepare(`
        SELECT
            id,
            nome,
            ordem,
            ativo,
            criado_em AS criadoEm,
            atualizado_em AS atualizadoEm
        FROM categorias
        ${where}
        ORDER BY ordem ASC, nome ASC
    `).all();
}

function salvarCategoria({ id, nome, ordem, ativo }) {
    const nomeLimpo = limparTexto(nome);

    if (!nomeLimpo) {
        throw new Error("Nome da categoria é obrigatório.");
    }

    const ordemNormalizada = Number.isFinite(Number(ordem)) ? Number(ordem) : 0;
    const ativoNormalizado = normalizarAtivo(ativo);

    if (id) {
        db.prepare(`
            UPDATE categorias
            SET nome = ?,
                ordem = ?,
                ativo = ?,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            nomeLimpo,
            ordemNormalizada,
            ativoNormalizado,
            Number(id)
        );

        return buscarCategoriaPorId(id);
    }

    const result = db.prepare(`
        INSERT INTO categorias (
            nome,
            ordem,
            ativo
        )
        VALUES (?, ?, ?)
    `).run(
        nomeLimpo,
        ordemNormalizada,
        ativoNormalizado
    );

    return buscarCategoriaPorId(result.lastInsertRowid);
}

function buscarCategoriaPorId(id) {
    return db.prepare(`
        SELECT
            id,
            nome,
            ordem,
            ativo,
            criado_em AS criadoEm,
            atualizado_em AS atualizadoEm
        FROM categorias
        WHERE id = ?
    `).get(Number(id));
}

function alterarStatusCategoria(id, ativo) {
    db.prepare(`
        UPDATE categorias
        SET ativo = ?,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        normalizarAtivo(ativo),
        Number(id)
    );

    return buscarCategoriaPorId(id);
}

// -----------------------------
// Produtos
// -----------------------------

function listarProdutos({ somenteAtivos = false } = {}) {
    const where = somenteAtivos ? "WHERE p.ativo = 1" : "";

    return db.prepare(`
        SELECT
            p.id,
            p.categoria_id AS categoriaId,
            c.nome AS categoriaNome,
            p.codigo_barras AS codigoBarras,
            p.nome,
            p.marca,
            p.descricao,
            p.preco_centavos AS precoCentavos,
            p.imagem_url AS imagemUrl,
            p.ativo,
            p.criado_em AS criadoEm,
            p.atualizado_em AS atualizadoEm
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        ${where}
        ORDER BY c.ordem ASC, c.nome ASC, p.nome ASC
    `).all();
}

function buscarProdutoPorId(id) {
    return db.prepare(`
        SELECT
            p.id,
            p.categoria_id AS categoriaId,
            c.nome AS categoriaNome,
            p.codigo_barras AS codigoBarras,
            p.nome,
            p.marca,
            p.descricao,
            p.preco_centavos AS precoCentavos,
            p.imagem_url AS imagemUrl,
            p.ativo,
            p.criado_em AS criadoEm,
            p.atualizado_em AS atualizadoEm
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ?
    `).get(Number(id));
}

function salvarProduto(produto) {
    const id = produto.id ? Number(produto.id) : null;
    const categoriaId = produto.categoriaId || produto.categoria_id || null;
    const codigoBarras = limparCodigoBarras(produto.codigoBarras || produto.codigo_barras);
    const nome = limparTexto(produto.nome);
    const marca = limparTexto(produto.marca);
    const descricao = limparTexto(produto.descricao);
    const precoCentavos = normalizarCentavos(
        produto.precoCentavos ||
        produto.preco_centavos ||
        produto.preco
    );
    const imagemUrl = limparTexto(produto.imagemUrl || produto.imagem_url);
    const ativo = normalizarAtivo(produto.ativo);

    if (!nome) {
        throw new Error("Nome do produto é obrigatório.");
    }

    if (id) {
        db.prepare(`
            UPDATE produtos
            SET categoria_id = ?,
                codigo_barras = ?,
                nome = ?,
                marca = ?,
                descricao = ?,
                preco_centavos = ?,
                imagem_url = ?,
                ativo = ?,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            categoriaId,
            codigoBarras,
            nome,
            marca,
            descricao,
            precoCentavos,
            imagemUrl,
            ativo,
            id
        );

        return buscarProdutoPorId(id);
    }

    const result = db.prepare(`
        INSERT INTO produtos (
            categoria_id,
            codigo_barras,
            nome,
            marca,
            descricao,
            preco_centavos,
            imagem_url,
            ativo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        categoriaId,
        codigoBarras,
        nome,
        marca,
        descricao,
        precoCentavos,
        imagemUrl,
        ativo
    );

    return buscarProdutoPorId(result.lastInsertRowid);
}

function alterarStatusProduto(id, ativo) {
    db.prepare(`
        UPDATE produtos
        SET ativo = ?,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        normalizarAtivo(ativo),
        Number(id)
    );

    return buscarProdutoPorId(id);
}

function excluirProduto(id) {
    const produtoId = Number(id);

    const produto = buscarProdutoPorId(produtoId);

    if (!produto) {
        return false;
    }

    const usadoEmPedidos = db.prepare(`
        SELECT COUNT(*) AS total
        FROM pedido_itens
        WHERE produto_id = ?
    `).get(produtoId);

    if (usadoEmPedidos.total > 0) {
        throw new Error("Este produto já foi usado em pedidos. Para preservar o histórico, desative o produto em vez de excluir.");
    }

    const result = db.prepare(`
        DELETE FROM produtos
        WHERE id = ?
    `).run(produtoId);

    return result.changes > 0;
}

// -----------------------------
// Pedidos
// -----------------------------

function criarPedido({ mesa, itens, observacao }) {
    const itensNormalizados = Array.isArray(itens) ? itens : [];
    const totalPedido = calcularTotalItens(itensNormalizados);

    const insertPedido = db.prepare(`
        INSERT INTO pedidos (
            numero_mesa,
            status,
            observacao,
            total_centavos
        )
        VALUES (?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
        INSERT INTO pedido_itens (
            pedido_id,
            produto_id,
            nome_produto,
            quantidade,
            preco_unitario_centavos,
            total_centavos,
            observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
        const pedidoResult = insertPedido.run(
            Number(mesa),
            "preparando",
            limparTexto(observacao),
            totalPedido
        );

        const pedidoId = pedidoResult.lastInsertRowid;

        for (const item of itensNormalizados) {
            const produtoId = item.produtoId || item.produto_id || null;
            const nome = item.nome || item.nomeProduto || String(item);
            const quantidade = Number(item.quantidade || 1);
            const precoUnitario = Number(
                item.preco_unitario_centavos ||
                item.precoCentavos ||
                item.precoUnitarioCentavos ||
                0
            );
            const totalItem = quantidade * precoUnitario;
            const observacaoItem = limparTexto(item.observacao);

            insertItem.run(
                pedidoId,
                produtoId,
                nome,
                quantidade,
                precoUnitario,
                totalItem,
                observacaoItem
            );
        }

        return pedidoId;
    });

    const pedidoId = transaction();

    return buscarPedidoPorId(pedidoId);
}

function mapearItensDoPedido(pedidoId) {
    const itens = db.prepare(`
        SELECT *
        FROM pedido_itens
        WHERE pedido_id = ?
        ORDER BY id ASC
    `).all(pedidoId);

    return itens.map((item) => ({
        id: item.id,
        produtoId: item.produto_id,
        nome: item.nome_produto,
        quantidade: item.quantidade,
        precoUnitarioCentavos: item.preco_unitario_centavos,
        totalCentavos: item.total_centavos,
        observacao: item.observacao || ""
    }));
}

function mapearPedido(pedido) {
    return {
        id: pedido.id,
        mesa: pedido.numero_mesa,
        status: pedido.status,
        observacao: pedido.observacao || "",
        totalCentavos: pedido.total_centavos || 0,
        criadoEm: pedido.criado_em,
        atualizadoEm: pedido.atualizado_em,
        itens: mapearItensDoPedido(pedido.id)
    };
}

function listarPedidos() {
    const pedidos = db.prepare(`
        SELECT *
        FROM pedidos
        ORDER BY id DESC
    `).all();

    return pedidos.map(mapearPedido);
}

function buscarPedidoPorId(id) {
    const pedido = db.prepare(`
        SELECT *
        FROM pedidos
        WHERE id = ?
    `).get(Number(id));

    if (!pedido) {
        return null;
    }

    return mapearPedido(pedido);
}

function atualizarStatusPedido(id, status) {
    db.prepare(`
        UPDATE pedidos
        SET status = ?,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(status, Number(id));

    return buscarPedidoPorId(id);
}

// -----------------------------
// Table sessions (mesa aberta)
// -----------------------------

function gerarSessionHash() {
    // Gera 8 hex chars
    return Math.random().toString(16).slice(2, 10);
}

function criarSessaoMesa({ restaurantId = null, tableNumber, deviceId = null, meta = null }) {
    const tableNumberStr = String(tableNumber || "").trim();

    if (!tableNumberStr) {
        throw new Error("Número da mesa é obrigatório.");
    }

    const sessionHash = gerarSessionHash();
    const publicId = `${tableNumberStr}-${sessionHash}`;

    const stmt = db.prepare(`
        INSERT INTO table_sessions (
            restaurant_id,
            table_number,
            session_hash,
            public_id,
            device_id,
            status,
            opened_at,
            last_seen,
            meta_json
        ) VALUES (?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    `);

    const result = stmt.run(
        restaurantId,
        tableNumberStr,
        sessionHash,
        publicId,
        deviceId,
        meta ? JSON.stringify(meta) : null
    );

    return buscarSessaoPorId(result.lastInsertRowid);
}

function buscarSessaoPorId(id) {
    const row = db.prepare(`SELECT * FROM table_sessions WHERE id = ?`).get(id);
    if (!row) return null;
    return {
        id: row.id,
        restaurantId: row.restaurant_id,
        tableNumber: row.table_number,
        sessionHash: row.session_hash,
        publicId: row.public_id,
        deviceId: row.device_id,
        status: row.status,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
        lastSeen: row.last_seen,
        meta: row.meta_json ? JSON.parse(row.meta_json) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function buscarSessaoPorPublicId(publicId) {
    const row = db.prepare(`SELECT * FROM table_sessions WHERE public_id = ?`).get(String(publicId));
    if (!row) return null;
    return buscarSessaoPorId(row.id);
}

function fecharSessaoPorPublicId(publicId) {
    const sess = db.prepare(`SELECT id FROM table_sessions WHERE public_id = ? AND status = 'open'`).get(String(publicId));
    if (!sess) return null;

    db.prepare(`
        UPDATE table_sessions
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(sess.id);

    return buscarSessaoPorId(sess.id);
}

module.exports = {
    db,

    criarPedido,
    listarPedidos,
    buscarPedidoPorId,
    atualizarStatusPedido,

    obterConfiguracoes,
    salvarConfiguracoes,

    listarCategorias,
    salvarCategoria,
    buscarCategoriaPorId,
    alterarStatusCategoria,

    listarProdutos,
    salvarProduto,
    buscarProdutoPorId,
    alterarStatusProduto,
    excluirProduto
    ,
    criarSessaoMesa,
    buscarSessaoPorPublicId,
    fecharSessaoPorPublicId
};
