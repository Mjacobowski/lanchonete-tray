/**
 * Script para popular o banco de dados com categorias e produtos de teste
 * Execute: node seed.js
 */

const {
    listarCategorias,
    salvarCategoria,
    salvarProduto,
    listarProdutos
} = require("./database");

async function seed() {
    console.log("🌱 Iniciando população do banco de dados...\n");

    try {
        // Verificar se já há categorias
        const categoriasExistentes = listarCategorias();
        if (categoriasExistentes.length > 0) {
            console.log(`✓ ${categoriasExistentes.length} categorias já existem. Pulando criação de categorias.\n`);
        } else {
            // Criar categorias
            console.log("📂 Criando categorias...");
            const categorias = [
                { nome: "Lanches", ordem: 1 },
                { nome: "Bebidas", ordem: 2 },
                { nome: "Acompanhamentos", ordem: 3 },
                { nome: "Sobremesas", ordem: 4 }
            ];

            for (const cat of categorias) {
                const categoria = salvarCategoria({ ...cat, ativo: 1 });
                console.log(`  ✓ ${categoria.nome}`);
            }
            console.log("");
        }

        // Verificar se já há produtos
        const produtosExistentes = listarProdutos();
        if (produtosExistentes.length > 0) {
            console.log(`✓ ${produtosExistentes.length} produtos já existem. Pulando criação de produtos.\n`);
        } else {
            // Obter categorias
            const cats = listarCategorias();
            const catLanches = cats.find(c => c.nome === "Lanches");
            const catBebidas = cats.find(c => c.nome === "Bebidas");
            const catAcompanhamentos = cats.find(c => c.nome === "Acompanhamentos");
            const catSobremesas = cats.find(c => c.nome === "Sobremesas");

            console.log("🍔 Criando produtos...");

            // Produtos de Lanches
            if (catLanches) {
                const lanches = [
                    {
                        categoriaId: catLanches.id,
                        nome: "X-Burguer",
                        descricao: "Pão, hambúrguer, queijo e molho especial",
                        precoCentavos: 1890,
                        ativo: 1
                    },
                    {
                        categoriaId: catLanches.id,
                        nome: "X-Salada",
                        descricao: "Pão, hambúrguer, queijo, alface, tomate e molho",
                        precoCentavos: 2190,
                        ativo: 1
                    },
                    {
                        categoriaId: catLanches.id,
                        nome: "X-Bacon",
                        descricao: "Pão, hambúrguer, queijo, bacon e molho especial",
                        precoCentavos: 2490,
                        ativo: 1
                    },
                    {
                        categoriaId: catLanches.id,
                        nome: "X-Frango",
                        descricao: "Pão, frango empanado, queijo e molho",
                        precoCentavos: 2090,
                        ativo: 1
                    }
                ];

                for (const produto of lanches) {
                    const criado = salvarProduto(produto);
                    console.log(`  ✓ ${criado.nome} - R$ ${(criado.precoCentavos / 100).toFixed(2)}`);
                }
            }

            // Produtos de Bebidas
            if (catBebidas) {
                const bebidas = [
                    {
                        categoriaId: catBebidas.id,
                        nome: "Coca-Cola lata",
                        descricao: "350ml gelada",
                        precoCentavos: 600,
                        ativo: 1
                    },
                    {
                        categoriaId: catBebidas.id,
                        nome: "Refrigerante Guaraná",
                        descricao: "350ml gelada",
                        precoCentavos: 600,
                        ativo: 1
                    },
                    {
                        categoriaId: catBebidas.id,
                        nome: "Suco Natural",
                        descricao: "300ml de suco natural do dia",
                        precoCentavos: 900,
                        ativo: 1
                    },
                    {
                        categoriaId: catBebidas.id,
                        nome: "Água",
                        descricao: "500ml de água mineral",
                        precoCentavos: 300,
                        ativo: 1
                    }
                ];

                for (const produto of bebidas) {
                    const criado = salvarProduto(produto);
                    console.log(`  ✓ ${criado.nome} - R$ ${(criado.precoCentavos / 100).toFixed(2)}`);
                }
            }

            // Produtos de Acompanhamentos
            if (catAcompanhamentos) {
                const acompanhamentos = [
                    {
                        categoriaId: catAcompanhamentos.id,
                        nome: "Batata Frita",
                        descricao: "Porção de batata frita crocante",
                        precoCentavos: 1200,
                        ativo: 1
                    },
                    {
                        categoriaId: catAcompanhamentos.id,
                        nome: "Onion Rings",
                        descricao: "Cebola empanada e frita",
                        precoCentavos: 1490,
                        ativo: 1
                    },
                    {
                        categoriaId: catAcompanhamentos.id,
                        nome: "Nuggets",
                        descricao: "6 unidades de frango empanado",
                        precoCentavos: 1890,
                        ativo: 1
                    }
                ];

                for (const produto of acompanhamentos) {
                    const criado = salvarProduto(produto);
                    console.log(`  ✓ ${criado.nome} - R$ ${(criado.precoCentavos / 100).toFixed(2)}`);
                }
            }

            // Produtos de Sobremesas
            if (catSobremesas) {
                const sobremesas = [
                    {
                        categoriaId: catSobremesas.id,
                        nome: "Sorvete",
                        descricao: "Sorvete em taça - 3 bolas",
                        precoCentavos: 990,
                        ativo: 1
                    },
                    {
                        categoriaId: catSobremesas.id,
                        nome: "Brownie",
                        descricao: "Brownie de chocolate com calda",
                        precoCentavos: 890,
                        ativo: 1
                    },
                    {
                        categoriaId: catSobremesas.id,
                        nome: "Milkshake",
                        descricao: "Milkshake 300ml - escolha o sabor",
                        precoCentavos: 1390,
                        ativo: 1
                    }
                ];

                for (const produto of sobremesas) {
                    const criado = salvarProduto(produto);
                    console.log(`  ✓ ${criado.nome} - R$ ${(criado.precoCentavos / 100).toFixed(2)}`);
                }
            }

            console.log("");
        }

        console.log("✅ População do banco de dados concluída!\n");

        // Listar resumo
        const catFinal = listarCategorias();
        const prodFinal = listarProdutos();
        console.log(`📊 Resumo:`);
        console.log(`   ${catFinal.length} categorias`);
        console.log(`   ${prodFinal.length} produtos`);

    } catch (error) {
        console.error("❌ Erro durante população do banco:", error.message);
        process.exit(1);
    }
}

seed().then(() => {
    process.exit(0);
}).catch(error => {
    console.error("❌ Erro não tratado:", error);
    process.exit(1);
});
