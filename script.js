// =========================================
// ALWAYS START IN USER MODE (prevents "Save As" showing admin UI)
// Created by Raptor8600
// =========================================

/* =========================================
   Resume Template Script (Main Template)
   - Admin mode toggles ONLY when you click Admin
   - Email/LinkedIn links normalize automatically
   - Theme colors editable in admin mode (saved locally)
========================================= */

const THEME_KEY = "cc_theme_v1";

function normalizeEditableLinks() {
    const links = document.querySelectorAll("a[data-editable-link]");
    links.forEach(a => {
        const rawHref = (a.getAttribute("href") || "").trim();
        const rawText = (a.textContent || "").trim();

        const raw = (rawHref && rawHref !== "#") ? rawHref : rawText;
        if (!raw) return;

        const cleaned = raw.replace(/\s+/g, "").trim();

        // Email -> mailto:
        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
        if (looksLikeEmail) {
            a.setAttribute("href", `mailto:${cleaned}`);
            return;
        }

        // Has scheme already
        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(cleaned);
        if (hasScheme) {
            a.setAttribute("href", cleaned);
            return;
        }

        // Domain -> https://
        const looksLikeDomain = /^[\w-]+\.[a-z]{2,}([/].*)?$/i.test(cleaned);
        if (looksLikeDomain) {
            a.setAttribute("href", `https://${cleaned}`);
        }
    });
}

function setEditable(isEditable) {
    document.querySelectorAll("[data-editable]").forEach(el => {
        el.setAttribute("contenteditable", String(isEditable));
    });

    // Links: allow admin to edit the href by clicking (your UI can decide how)
    // We just normalize after they finish typing/pasting.
    if (!isEditable) normalizeEditableLinks();
}

function showAdminUI(show) {
    // This overrides inline display:none that would otherwise block admin-only UI.
    document.querySelectorAll("[data-admin-only='true']").forEach(el => {
        if (show) {
            el.classList.remove("hidden");
            el.style.display = "";
        } else {
            el.classList.add("hidden");
            el.style.display = "none";
        }
    });
}

function enterEditMode() {
    document.body.classList.remove("read-only");
    document.body.classList.add("edit-active");
    showAdminUI(true);
    setEditable(true);
}

function exitEditMode() {
    document.body.classList.add("read-only");
    document.body.classList.remove("edit-active", "sidebar-active");
    showAdminUI(false);
    setEditable(false);

    // Ensure links are correct in user mode
    normalizeEditableLinks();
}

function applyTheme(theme) {
    // theme: { primary, secondary, bg }
    const root = document.documentElement;
    if (theme.primary) root.style.setProperty("--color-primary", theme.primary);
    if (theme.secondary) root.style.setProperty("--color-secondary", theme.secondary);
    if (theme.bg) root.style.setProperty("--color-bg-white", theme.bg);
}

function loadTheme() {
    try {
        const raw = localStorage.getItem(THEME_KEY);
        if (!raw) return;
        const theme = JSON.parse(raw);
        applyTheme(theme);

        // Update inputs if present
        const primary = document.getElementById("theme-primary");
        const secondary = document.getElementById("theme-secondary");
        const bg = document.getElementById("theme-bg");
        if (primary && theme.primary) primary.value = theme.primary;
        if (secondary && theme.secondary) secondary.value = theme.secondary;
        if (bg && theme.bg) bg.value = theme.bg;
    } catch {
        // ignore bad storage
    }
}

function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    applyTheme(theme);
}

document.addEventListener("DOMContentLoaded", () => {
    // Always start user-mode
    exitEditMode();

    // Normalize links on load
    normalizeEditableLinks();

    // Load theme (safe in user mode)
    loadTheme();

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute("href"))?.scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    // Mobile menu
    const menuToggle = document.getElementById("mobile-menu");
    const navLinks = document.querySelector(".nav-links");
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // ADMIN TRIGGER
    const adminTrigger = document.getElementById("admin-trigger");
    if (adminTrigger) {
        adminTrigger.addEventListener("click", (e) => {
            e.preventDefault();
            // Toggle
            if (document.body.classList.contains("edit-active")) {
                exitEditMode();
            } else {
                enterEditMode();
            }
        });
    }

    // Save / Discard buttons
    const saveBtn = document.getElementById("save-btn");
    const cancelBtn = document.getElementById("cancel-btn");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            // No backend connected: we at least normalize links + exit edit mode.
            normalizeEditableLinks();
            exitEditMode();
            alert("Saved locally (no cloud connected yet).");
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            // simplest “discard” without backend: reload page
            location.reload();
        });
    }

    // Theme panel toggles + inputs
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const themePanel = document.getElementById("theme-panel");
    const themeResetBtn = document.getElementById("theme-reset-btn");

    const primaryInput = document.getElementById("theme-primary");
    const secondaryInput = document.getElementById("theme-secondary");
    const bgInput = document.getElementById("theme-bg");

    if (themeToggleBtn && themePanel) {
        themeToggleBtn.addEventListener("click", () => {
            themePanel.classList.toggle("hidden");
        });
    }

    function handleThemeChange() {
        const theme = {
            primary: primaryInput?.value,
            secondary: secondaryInput?.value,
            bg: bgInput?.value
        };
        saveTheme(theme);
    }

    [primaryInput, secondaryInput, bgInput].forEach(inp => {
        if (inp) inp.addEventListener("input", handleThemeChange);
    });

    if (themeResetBtn) {
        themeResetBtn.addEventListener("click", () => {
            localStorage.removeItem(THEME_KEY);
            // Reset inline overrides
            document.documentElement.style.removeProperty("--color-primary");
            document.documentElement.style.removeProperty("--color-secondary");
            document.documentElement.style.removeProperty("--color-bg-white");
            location.reload();
        });
    }

    // ==============================
    // Resume PDF (local-only)
    // ==============================
    const RESUME_KEY = "cc_resume_pdf_dataurl_v1";

    function loadSavedResume() {
        const a = document.getElementById("resume-download");
        if (!a) return;

        const saved = localStorage.getItem(RESUME_KEY);
        if (saved) {
            a.href = saved;
            a.setAttribute("download", "resume.pdf");
        }
    }

    function promptResumeUploadIfEditing(e) {
        const a = document.getElementById("resume-download");
        if (!a) return;

        const isEditing = document.body.classList.contains("edit-active");
        if (!isEditing) return; // in user mode, let it behave like a normal download link

        // In edit mode: clicking the button should upload/replace the PDF
        e.preventDefault();

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf";

        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = String(reader.result || "");
                // Save locally so it persists after refresh
                try {
                    localStorage.setItem(RESUME_KEY, dataUrl);
                } catch (err) {
                    alert("Resume file is too large to store locally in this browser. Try a smaller PDF.");
                    return;
                }

                a.href = dataUrl;
                a.setAttribute("download", file.name || "resume.pdf");
                alert("Resume updated (saved locally in your browser).");
            };

            reader.readAsDataURL(file);
        });

        input.click();
    }

    // Run on load
    loadSavedResume();

    // Click handler
    const resumeLink = document.getElementById("resume-download");
    if (resumeLink) {
        resumeLink.addEventListener("click", promptResumeUploadIfEditing);
    }
});

// Normalize links when admin finishes editing a link
document.addEventListener("focusout", (e) => {
    const el = e.target;
    if (el && el.matches && el.matches("a[data-editable-link]")) {
        normalizeEditableLinks();
    }
});