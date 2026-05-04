const http = require("http");
const { Server } = require("socket.io");
const { app, Tray, Menu, shell, dialog } = require("electron");
const express = require("express");
const path = require("path");
const os = require("os");

const {
    criarPedido,
    listarPedidos,
    atualizarStatusPedido,
    obterConfiguracoes,
    salvarConfiguracoes
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

function startLocalServer() {
    const web = express();

    web.use(express.json());
    web.use(express.static(path.join(__dirname, "public")));

    const httpServer = http.createServer(web);
    const io = new Server(httpServer);

    // Páginas principais
    web.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    web.get("/balcao", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "balcao.html"));
    });

    web.get("/manager", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "manager.html"));
    });

    web.get("/manager/cardapio", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "cardapio.html"));
    });

    web.get("/manager/configuracoes", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "configuracoes.html"));
    });

    web.get("/cozinha", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "cozinha.html"));
    });

    web.get("/painel", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "painel.html"));
    });

    // Importante: precisa vir antes de /mesa/:numero
    web.get("/mesa/preview", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "mesa.html"));
    });

    web.get("/mesa/:numero", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "mesa.html"));
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

    // API de pedidos
    web.get("/api/pedidos", (req, res) => {
        const pedidos = listarPedidos();
        res.json(pedidos);
    });

    web.post("/api/pedidos", (req, res) => {
        const novoPedido = criarPedido({
            mesa: req.body.mesa,
            itens: req.body.itens || []
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

        socket.emit("pedidos_atualizados", listarPedidos());
    });

    server = httpServer.listen(PORT, "0.0.0.0", () => {
        const ip = getLocalIp();
        console.log(`Servidor rodando em http://${ip}:${PORT}`);
    });
}

function createTray() {
    const ip = getLocalIp();
    const url = `http://${ip}:${PORT}`;

    tray = new Tray(path.join(__dirname, "icon.png"));

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

                app.quit();
            }
        }
    ]);

    tray.setToolTip("Servidor da Lanchonete");
    tray.setContextMenu(menu);
}

app.whenReady().then(() => {
    startLocalServer();
    createTray();

    app.setLoginItemSettings({
        openAtLogin: true
    });
});

app.on("window-all-closed", (event) => {
    event.preventDefault();
});