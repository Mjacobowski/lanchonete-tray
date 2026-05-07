/**
 * Theme Loader - carrega dados/cores da loja e aplica no CSS.
 *
 * A identidade visual base fica no layout-base.css. Aqui só trocamos
 * as variáveis de cor para respeitar a customização do cliente.
 */

class ThemeLoader {
    constructor() {
        this.configuracoes = null;
        this.loadTheme();
    }

    async loadTheme() {
        try {
            const response = await fetch('/api/configuracoes');
            if (!response.ok) throw new Error('Falha ao carregar configurações');

            this.configuracoes = await response.json();
            this.applyTheme();
            this.applyStoreData();
        } catch (error) {
            console.warn('Usando tema padrão:', error.message);
            this.applyDefaultTheme();
        }
    }

    setVar(nome, valor) {
        if (valor) {
            document.documentElement.style.setProperty(nome, valor);
        }
    }

    applyTheme() {
        const tema = this.configuracoes?.tema || {};

        const primaria = tema.corPrimaria || '#d62300';
        const secundaria = tema.corSecundaria || '#2b1a10';
        const destaque = tema.corDestaque || '#ffb703';

        this.setVar('--cor-primaria', primaria);
        this.setVar('--cor-secundaria', secundaria);
        this.setVar('--cor-destaque', destaque);

        // Aliases usados pelo padrão visual Saga/BK.
        this.setVar('--vermelho-bk', primaria);
        this.setVar('--marrom-dark', secundaria);
        this.setVar('--amarelo-bk', destaque);

        console.log('✓ Tema aplicado com sucesso');
    }

    applyDefaultTheme() {
        this.configuracoes = {
            loja: {},
            tema: {
                corPrimaria: '#d62300',
                corSecundaria: '#2b1a10',
                corDestaque: '#ffb703'
            }
        };
        this.applyTheme();
    }

    applyStoreData() {
        const loja = this.configuracoes?.loja || {};
        const nome = loja.nomeFantasia || 'Lanchonete';
        const logoUrl = loja.logoUrl || '';

        document.querySelectorAll('[data-store-name]').forEach((el) => {
            el.textContent = nome;
        });

        if (document.title.includes('Lanchonete') && nome) {
            document.title = document.title.replace('Lanchonete', nome);
        }

        document.querySelectorAll('[data-store-logo]').forEach((img) => {
            if (logoUrl) {
                img.src = logoUrl;
                img.style.display = '';
            }
        });
    }

    updateTheme(novasConfiguracoes) {
        this.configuracoes = { ...this.configuracoes, ...novasConfiguracoes };
        this.applyTheme();
        this.applyStoreData();
    }

    getTheme() {
        return this.configuracoes;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeLoader = new ThemeLoader();
    });
} else {
    window.themeLoader = new ThemeLoader();
}
