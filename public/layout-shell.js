function inicializarLayoutShell() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    document.querySelectorAll('.nav-item').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;

        try {
            const destino = new URL(href, window.location.origin);
            link.classList.remove('active');

            if (destino.pathname === window.location.pathname) {
                link.classList.add('active');
            }
        } catch (_) {}
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarLayoutShell);
} else {
    inicializarLayoutShell();
}
