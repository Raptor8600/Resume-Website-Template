// =========================================
// ALWAYS START IN USER MODE (prevents "Save As" showing admin UI)
// Created by Raptor8600
// =========================================

/* =========================================================
   Link Normalizer (Email + LinkedIn + generic URLs)
   - Converts admin-entered text into a valid clickable href
========================================================= */
function normalizeEditableLinks() {
    const links = document.querySelectorAll('a[data-editable-link]');

    links.forEach(a => {
        const rawHref = (a.getAttribute('href') || '').trim();
        const rawText = (a.textContent || '').trim();

        // Use href unless it's empty or "#"
        const raw = (rawHref && rawHref !== '#') ? rawHref : rawText;
        if (!raw) return;

        const cleaned = raw.replace(/\s+/g, '').trim();

        // Email -> mailto:
        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
        if (looksLikeEmail) {
            a.setAttribute('href', `mailto:${cleaned}`);
            return;
        }

        // Already has a scheme (http/https/mailto/tel/etc.)
        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(cleaned);
        if (hasScheme) {
            a.setAttribute('href', cleaned);
            return;
        }

        // Domain (linkedin.com/..., github.com/..., etc.) -> https://
        const looksLikeDomain = /^[\w-]+\.[a-z]{2,}([/].*)?$/i.test(cleaned);
        if (looksLikeDomain) {
            a.setAttribute('href', `https://${cleaned}`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1) Force USER MODE on every load (no exceptions)
    document.body.classList.add('read-only');
    document.body.classList.remove('edit-active', 'sidebar-active');

    // 2) Force-disable any editable fields if a saved copy preserved them
    document.querySelectorAll("[contenteditable='true']").forEach(el => {
        el.setAttribute('contenteditable', 'false');
    });

    // 3) Ensure email/LinkedIn links are valid and clickable
    normalizeEditableLinks();

    // 4) Smooth scroll (your original behavior)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 5) Mobile menu (your original behavior)
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});

// If admin edits/pastes a link, fix it when they click away
document.addEventListener('focusout', (e) => {
    const el = e.target;
    if (el && el.matches && el.matches('a[data-editable-link]')) {
        normalizeEditableLinks();
    }
});