/**
 * Theme Loader - Carrega configurações de cores da empresa
 * e aplica dinamicamente no CSS
 */

class ThemeLoader {
    constructor() {
        this.configuracoes = null;
        this.loadTheme();
    }

    /**
     * Carrega as configurações do servidor
     */
    async loadTheme() {
        try {
            const response = await fetch('/api/configuracoes');
            if (!response.ok) throw new Error('Falha ao carregar configurações');
            
            this.configuracoes = await response.json();
            this.applyTheme();
        } catch (error) {
            console.warn('Usando tema padrão:', error.message);
            this.applyDefaultTheme();
        }
    }

    /**
     * Aplica o tema baseado nas configurações carregadas
     */
    applyTheme() {
        const config = this.configuracoes;
        const root = document.documentElement;

        // Cores do tema
        const tema = config.tema || {};
        
        if (tema.corPrimaria) {
            root.style.setProperty('--cor-primaria', tema.corPrimaria);
        }
        
        if (tema.corSecundaria) {
            root.style.setProperty('--cor-secundaria', tema.corSecundaria);
        }
        
        if (tema.corDestaque) {
            root.style.setProperty('--cor-destaque', tema.corDestaque);
        }

        console.log('✓ Tema aplicado com sucesso');
    }

    /**
     * Aplica tema padrão (fallback)
     */
    applyDefaultTheme() {
        const root = document.documentElement;
        
        root.style.setProperty('--cor-primaria', '#e11d48');
        root.style.setProperty('--cor-secundaria', '#0f172a');
        root.style.setProperty('--cor-destaque', '#f59e0b');
        root.style.setProperty('--fundo', '#f3f4f6');
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--texto', '#111827');
    }

    /**
     * Atualiza tema em tempo real (útil para manager)
     */
    updateTheme(novasConfiguracoes) {
        this.configuracoes = { ...this.configuracoes, ...novasConfiguracoes };
        this.applyTheme();
    }

    /**
     * Obtém configurações atuais
     */
    getTheme() {
        return this.configuracoes;
    }
}

// Instancia e carrega o tema quando o DOM está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeLoader = new ThemeLoader();
    });
} else {
    window.themeLoader = new ThemeLoader();
}
