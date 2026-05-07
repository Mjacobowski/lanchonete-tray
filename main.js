const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const path = require("path");
const os = require("os");

const isWebOnly = process.argv.includes("--web-only") || process.env.LANCHONETE_WEB_ONLY === "1";
let electron = null;

const {
    criarPedido,
    listarPedidos,
    atualizarStatusPedido,
    obterConfiguracoes,
    salvarConfiguracoes,

    listarCategorias,
    salvarCategoria,
    alterarStatusCategoria,

    listarProdutos,
    salvarProduto,
    alterarStatusProduto,
    excluirProduto
} = require("./database");

let tray = null;
let server = null;

const PORT = 3000;

function getLocalIp() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const item of interfaces[name]) {
            if (item.family === "IPv4" && !item.internal) {
                return item.address;
            }
        }
    }

    return "localhost";
}

function limparCodigoBarras(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function validarGtin(codigo) {
    const numeros = limparCodigoBarras(codigo);
    const tamanhosValidos = [8, 12, 13, 14];

    if (!tamanhosValidos.includes(numeros.length)) {
        return false;
    }

    const digitos = numeros.split("").map(Number);
    const digitoVerificador = digitos.pop();

    let soma = 0;
    let peso = 3;

    for (let i = digitos.length - 1; i >= 0; i--) {
        soma += digitos[i] * peso;
        peso = peso === 3 ? 1 : 3;
    }

    const calculado = (10 - (soma % 10)) % 10;

    return calculado === digitoVerificador;
}

function sendPublicFile(res, arquivo) {
    res.sendFile(arquivo, { root: path.resolve(__dirname, "public") });
}

function normalizarCorCss(valor, fallback) {
    const cor = String(valor || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : fallback;
}

function cssTemaAtual() {
    const configuracoes = obterConfiguracoes();
    const tema = configuracoes.tema || {};

    const primaria = normalizarCorCss(tema.corPrimaria, "#d62300");
    const secundaria = normalizarCorCss(tema.corSecundaria, "#2b1a10");
    const destaque = normalizarCorCss(tema.corDestaque, "#ffb703");

    return `:root {
  --cor-primaria: ${primaria};
  --cor-secundaria: ${secundaria};
  --cor-destaque: ${destaque};
  --vermelho-bk: ${primaria};
  --marrom-dark: ${secundaria};
  --amarelo-bk: ${destaque};
}\n`;
}

function startLocalServer() {
    const web = express();

    web.use(express.json());
    web.use(express.static(path.join(__dirname, "public")));

    const httpServer = http.createServer(web);
    const io = new Server(httpServer);

    web.get("/theme.css", (req, res) => {
        res.type("text/css");
        res.set("Cache-Control", "no-store");
        res.send(cssTemaAtual());
    });

    function broadcastCatalogo() {
        try {
            const categoriasTodas = listarCategorias();
            const produtosTodos = listarProdutos();
            const categoriasAtivas = listarCategorias({ somenteAtivas: true });
            const produtosAtivos = listarProdutos({ somenteAtivos: true });

            // Eventos granulares (compatibilidade)
            io.emit("categorias_atualizadas", categoriasTodas);
            io.emit("produtos_atualizados", produtosTodos);

            // Evento consolidado otimizado para clientes de vitrine (mesa)
            io.emit("catalogo_atualizado", {
                categorias: categoriasAtivas,
                produtos: produtosAtivos
            });
        } catch (e) {
            console.error("Erro ao emitir catálogo:", e);
        }
    }

    // Páginas principais
    web.get("/", (req, res) => {
        sendPublicFile(res, "index.html");
    });

    web.get("/balcao", (req, res) => {
        sendPublicFile(res, "balcao.html");
    });

    web.get("/manager", (req, res) => {
        sendPublicFile(res, "manager.html");
    });

    web.get("/manager/cardapio", (req, res) => {
        sendPublicFile(res, "cardapio.html");
    });

    web.get("/manager/configuracoes", (req, res) => {
        sendPublicFile(res, "configuracoes.html");
    });

    web.get("/cozinha", (req, res) => {
        sendPublicFile(res, "cozinha.html");
    });

    web.get("/painel", (req, res) => {
        sendPublicFile(res, "painel.html");
    });

    // Importante: precisa vir antes de /mesa/:numero
    web.get("/mesa/preview", (req, res) => {
        sendPublicFile(res, "mesa.html");
    });

    web.get("/mesa/:numero", (req, res) => {
        sendPublicFile(res, "mesa.html");
    });

    // API da mesa
    web.get("/api/mesa/:numero", (req, res) => {
        const numeroMesa = Number(req.params.numero);

        res.json({
            mesa: numeroMesa,
            nome: `Mesa ${numeroMesa}`
        });
    });

    // API de configurações
    web.get("/api/configuracoes", (req, res) => {
        const configuracoes = obterConfiguracoes();
        res.json(configuracoes);
    });

    web.post("/api/configuracoes", (req, res) => {
        const configuracoes = salvarConfiguracoes(req.body);

        res.json({
            ok: true,
            mensagem: "Configurações salvas com sucesso!",
            configuracoes
        });
    });

    // API de consulta de CNPJ
    web.get("/api/cnpj/:cnpj", async (req, res) => {
        try {
            const cnpjLimpo = String(req.params.cnpj).replace(/\D/g, "");

            if (cnpjLimpo.length !== 14) {
                return res.status(400).json({
                    ok: false,
                    mensagem: "CNPJ inválido. Informe 14 números."
                });
            }

            async function buscarBrasilApi() {
                const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);

                if (!resposta.ok) {
                    return null;
                }

                const dados = await resposta.json();

                const enderecoPartes = [
                    dados.logradouro,
                    dados.numero,
                    dados.complemento,
                    dados.bairro
                ].filter(Boolean);

                return {
                    nomeFantasia: dados.nome_fantasia || dados.razao_social || "",
                    razaoSocial: dados.razao_social || "",
                    cnpj: cnpjLimpo,
                    telefone: dados.ddd_telefone_1 || "",
                    email: dados.email || "",
                    endereco: enderecoPartes.join(", "),
                    cidade: dados.municipio || "",
                    estado: dados.uf || ""
                };
            }

            async function buscarCnpjWs() {
                const resposta = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`);

                if (!resposta.ok) {
                    return null;
                }

                const dados = await resposta.json();
                const estabelecimento = dados.estabelecimento || {};

                const enderecoPartes = [
                    estabelecimento.tipo_logradouro,
                    estabelecimento.logradouro,
                    estabelecimento.numero,
                    estabelecimento.complemento,
                    estabelecimento.bairro
                ].filter(Boolean);

                const telefonePartes = [
                    estabelecimento.ddd1,
                    estabelecimento.telefone1
                ].filter(Boolean);

                return {
                    nomeFantasia: estabelecimento.nome_fantasia || dados.razao_social || "",
                    razaoSocial: dados.razao_social || "",
                    cnpj: cnpjLimpo,
                    telefone: telefonePartes.join(" "),
                    email: estabelecimento.email || "",
                    endereco: enderecoPartes.join(", "),
                    cidade: estabelecimento.cidade?.nome || "",
                    estado: estabelecimento.estado?.sigla || ""
                };
            }

            const loja = await buscarBrasilApi() || await buscarCnpjWs();

            if (!loja) {
                return res.status(404).json({
                    ok: false,
                    mensagem: "CNPJ não encontrado nas fontes disponíveis."
                });
            }

            res.json({
                ok: true,
                loja
            });
        } catch (error) {
            console.error("Erro ao consultar CNPJ:", error);

            res.status(500).json({
                ok: false,
                mensagem: "Erro ao consultar CNPJ. Verifique a internet e tente novamente."
            });
        }
    });

    // API de categorias
    web.get("/api/categorias", (req, res) => {
        const somenteAtivas = req.query.ativas === "1";
        const categorias = listarCategorias({ somenteAtivas });

        res.json(categorias);
    });

    web.post("/api/categorias", (req, res) => {
        try {
            const categoria = salvarCategoria(req.body);

            res.json({
                ok: true,
                mensagem: "Categoria salva com sucesso!",
                categoria
            });
            // Notificar todos os clientes
            broadcastCatalogo();
        } catch (error) {
            res.status(400).json({
                ok: false,
                mensagem: error.message || "Erro ao salvar categoria."
            });
        }
    });

    web.patch("/api/categorias/:id/status", (req, res) => {
        try {
            const categoria = alterarStatusCategoria(req.params.id, req.body.ativo);

            if (!categoria) {
                return res.status(404).json({
                    ok: false,
                    mensagem: "Categoria não encontrada."
                });
            }

            res.json({
                ok: true,
                categoria
            });
            // Notificar todos os clientes
            broadcastCatalogo();
        } catch (error) {
            res.status(400).json({
                ok: false,
                mensagem: error.message || "Erro ao alterar categoria."
            });
        }
    });

    // API de produtos
    web.get("/api/produtos", (req, res) => {
        const somenteAtivos = req.query.ativos === "1";
        const produtos = listarProdutos({ somenteAtivos });

        res.json(produtos);
    });

    web.post("/api/produtos", (req, res) => {
        try {
            const produto = salvarProduto(req.body);

            res.json({
                ok: true,
                mensagem: "Produto salvo com sucesso!",
                produto
            });
            // Notificar todos os clientes
            broadcastCatalogo();
        } catch (error) {
            res.status(400).json({
                ok: false,
                mensagem: error.message || "Erro ao salvar produto."
            });
        }
    });

    web.patch("/api/produtos/:id/status", (req, res) => {
        try {
            const produto = alterarStatusProduto(req.params.id, req.body.ativo);

            if (!produto) {
                return res.status(404).json({
                    ok: false,
                    mensagem: "Produto não encontrado."
                });
            }

            res.json({
                ok: true,
                produto
            });
            // Notificar todos os clientes
            broadcastCatalogo();
        } catch (error) {
            res.status(400).json({
                ok: false,
                mensagem: error.message || "Erro ao alterar produto."
            });
        }
    });

    web.delete("/api/produtos/:id", (req, res) => {
        try {
            const removido = excluirProduto(req.params.id);

            if (!removido) {
                return res.status(404).json({
                    ok: false,
                    mensagem: "Produto não encontrado."
                });
            }

            res.json({
                ok: true,
                mensagem: "Produto excluído com sucesso."
            });
            // Notificar todos os clientes
            broadcastCatalogo();
        } catch (error) {
            res.status(400).json({
                ok: false,
                mensagem: error.message || "Erro ao excluir produto."
            });
        }
    });

    // Busca de produto por código de barras
    // Não salva automaticamente. Só retorna dados para preencher o formulário.
    web.get("/api/produtos/buscar-codigo/:codigo", async (req, res) => {
        try {
            const codigo = limparCodigoBarras(req.params.codigo);

            if (!validarGtin(codigo)) {
                return res.status(400).json({
                    ok: false,
                    mensagem: "Código de barras inválido. Verifique os números digitados."
                });
            }

            const resposta = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codigo}.json`);

            if (!resposta.ok) {
                return res.status(404).json({
                    ok: false,
                    mensagem: "Produto não encontrado na base pública."
                });
            }

            const dados = await resposta.json();

            if (!dados.product) {
                return res.status(404).json({
                    ok: false,
                    mensagem: "Produto não encontrado na base pública."
                });
            }

            const produto = dados.product;

            const nome =
                produto.product_name_pt ||
                produto.product_name ||
                produto.generic_name_pt ||
                produto.generic_name ||
                "";

            const marca = produto.brands || "";

            const descricaoPartes = [
                produto.quantity,
                produto.categories
            ].filter(Boolean);

            const imagemUrl =
                produto.image_front_url ||
                produto.image_url ||
                "";

            res.json({
                ok: true,
                mensagem: "Produto encontrado. Revise os dados antes de salvar.",
                produto: {
                    codigoBarras: codigo,
                    nome,
                    marca,
                    descricao: descricaoPartes.join(" - "),
                    imagemUrl
                }
            });
        } catch (error) {
            console.error("Erro ao buscar produto por código de barras:", error);

            res.status(500).json({
                ok: false,
                mensagem: "Erro ao buscar produto. Verifique a internet e tente novamente."
            });
        }
    });

    // API de pedidos
    web.get("/api/pedidos", (req, res) => {
        const pedidos = listarPedidos();
        res.json(pedidos);
    });

    web.post("/api/pedidos", (req, res) => {
        const novoPedido = criarPedido({
            mesa: req.body.mesa,
            itens: req.body.itens || [],
            observacao: req.body.observacao || ""
        });

        console.log("Pedido recebido:", novoPedido);

        const pedidos = listarPedidos();
        io.emit("pedidos_atualizados", pedidos);

        res.json({
            ok: true,
            mensagem: "Pedido enviado para a cozinha!",
            pedido: novoPedido
        });
    });

    web.patch("/api/pedidos/:id/status", (req, res) => {
        const id = Number(req.params.id);
        const pedido = atualizarStatusPedido(id, req.body.status);

        if (!pedido) {
            return res.status(404).json({
                ok: false,
                mensagem: "Pedido não encontrado"
            });
        }

        const pedidos = listarPedidos();
        io.emit("pedidos_atualizados", pedidos);

        res.json({
            ok: true,
            pedido
        });
    });

    // Tempo real
    io.on("connection", (socket) => {
        console.log("Cliente conectado no tempo real:", socket.id);

        // Estado inicial para clientes
        socket.emit("pedidos_atualizados", listarPedidos());
        try {
            const categoriasAtivas = listarCategorias({ somenteAtivas: true });
            const produtosAtivos = listarProdutos({ somenteAtivos: true });
            socket.emit("catalogo_atualizado", {
                categorias: categoriasAtivas,
                produtos: produtosAtivos
            });
        } catch (e) {
            console.error("Erro ao enviar catálogo inicial:", e);
        }

        // Requisição ativa do cliente para reenviar catálogo sob demanda
        socket.on("listar_catalogo", () => {
            try {
                const categoriasAtivas = listarCategorias({ somenteAtivas: true });
                const produtosAtivos = listarProdutos({ somenteAtivos: true });
                socket.emit("catalogo_atualizado", {
                    categorias: categoriasAtivas,
                    produtos: produtosAtivos
                });
            } catch (e) {
                console.error("Erro ao listar catálogo sob demanda:", e);
            }
        });
    });

    server = httpServer.listen(PORT, "0.0.0.0", () => {
        const ip = getLocalIp();
        console.log(`Servidor rodando em http://${ip}:${PORT}`);
    });
}

function createTray() {
    const { Tray, Menu, shell, dialog } = electron;
    const ip = getLocalIp();
    const url = `http://${ip}:${PORT}`;

    tray = new Tray(path.join(__dirname, "public", "img", "icon.png"));

    const menu = Menu.buildFromTemplate([
        {
            label: "Abrir painel",
            click: () => {
                shell.openExternal(url);
            }
        },
        {
            label: `Endereço: ${url}`,
            enabled: false
        },
        {
            label: "Mostrar IP",
            click: () => {
                dialog.showMessageBox({
                    type: "info",
                    title: "Servidor da Lanchonete",
                    message: `Acesse nos tablets:\n${url}`
                });
            }
        },
        {
            type: "separator"
        },
        {
            label: "Sair",
            click: () => {
                if (server) {
                    server.close();
                }

                electron.app.quit();
            }
        }
    ]);

    tray.setToolTip("Servidor da Lanchonete");
    tray.setContextMenu(menu);
}

if (isWebOnly) {
    startLocalServer();
} else {
    electron = require("electron");

    electron.app.whenReady().then(() => {
        startLocalServer();
        createTray();

        electron.app.setLoginItemSettings({
            openAtLogin: true
        });
    });

    electron.app.on("window-all-closed", (event) => {
        event.preventDefault();
    });
}