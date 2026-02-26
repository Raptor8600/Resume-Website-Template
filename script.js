// =========================================
// ALWAYS START IN USER MODE (prevents "Save As" showing admin UI)
// Created by Raptor8600
// =========================================

/* =========================================
   Resume Template Script (Main Template)
   - Admin requires password (Password-M-Z-A)
   - Save exports a fresh index.html snapshot
========================================= */

const ADMIN_PASSWORD = "Password-M-Z-A";


// --- Hotfix: prevent querySelector('#') from crashing the entire script ---
(() => {
    const docQS = Document.prototype.querySelector;
    const elQS = Element.prototype.querySelector;

    function safeQS(original, ctx, selector) {
        if (selector === '#') return null; // common bad selector from href="#"
        try {
            return original.call(ctx, selector);
        } catch (err) {
            // If any invalid selector slips through, don't kill the whole app
            return null;
        }
    }

    Document.prototype.querySelector = function (selector) {
        return safeQS(docQS, this, selector);
    };

    Element.prototype.querySelector = function (selector) {
        return safeQS(elQS, this, selector);
    };
})();

/* ---------- Link Normalizer (Email/LinkedIn) ---------- */
function normalizeEditableLinks() {
    const links = document.querySelectorAll("a[data-editable-link]");
    links.forEach(a => {
        const rawHref = (a.getAttribute("href") || "").trim();
        const rawText = (a.textContent || "").trim();
        const raw = (rawHref && rawHref !== "#") ? rawHref : rawText;
        if (!raw) return;

        const cleaned = raw.replace(/\s+/g, "").trim();

        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
        if (looksLikeEmail) {
            a.setAttribute("href", `mailto:${cleaned}`);
            return;
        }

        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(cleaned);
        if (hasScheme) {
            a.setAttribute("href", cleaned);
            return;
        }

        const looksLikeDomain = /^[\w-]+\.[a-z]{2,}([/].*)?$/i.test(cleaned);
        if (looksLikeDomain) {
            a.setAttribute("href", `https://${cleaned}`);
        }
    });
}

/* ---------- Edit Mode ---------- */
function setEditable(isEditable) {
    document.querySelectorAll("[data-editable]").forEach(el => {
        el.setAttribute("contenteditable", String(isEditable));
    });
}

function enterEditMode() {
    document.body.classList.remove("read-only");
    document.body.classList.add("edit-active");
    setEditable(true);
}

function exitEditMode() {
    document.body.classList.add("read-only");
    document.body.classList.remove("edit-active", "sidebar-active");
    setEditable(false);
    normalizeEditableLinks();
}

/* ---------- Password Modal (reuses #auth-modal) ---------- */
function openAdminPasswordModal() {
    const modal = document.getElementById("auth-modal");
    if (!modal) {
        alert("Auth modal not found in index.html.");
        return;
    }

    const title = document.getElementById("auth-title");
    const form = document.getElementById("auth-form");
    const emailGroup = document.querySelector('label[for="email"]')?.closest(".form-group");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitBtn = document.getElementById("auth-submit");
    const toggleLink = document.getElementById("auth-toggle");
    const closeBtn = document.getElementById("auth-close");

    // Configure modal for admin password only
    if (title) title.textContent = "Admin Access";
    if (submitBtn) submitBtn.textContent = "Unlock Edit Mode";
    if (toggleLink) toggleLink.style.display = "none";

    if (emailGroup) emailGroup.style.display = "none";
    if (emailInput) emailInput.value = "";
    if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
    }

    modal.classList.remove("hidden");

    function closeModal() {
        modal.classList.add("hidden");
        if (toggleLink) toggleLink.style.display = "";
        if (emailGroup) emailGroup.style.display = "";
        form?.removeEventListener("submit", onSubmit);
        closeBtn?.removeEventListener("click", onClose);
    }

    function onClose(e) {
        e.preventDefault();
        closeModal();
    }

    function onSubmit(e) {
        e.preventDefault();
        const entered = (passwordInput?.value || "").trim();
        if (entered === ADMIN_PASSWORD) {
            closeModal();
            enterEditMode();
        } else {
            alert("Wrong password.");
            if (passwordInput) passwordInput.value = "";
            passwordInput?.focus();
        }
    }

    form?.addEventListener("submit", onSubmit);
    closeBtn?.addEventListener("click", onClose);
}

/* ---------- Export index.html on Save ---------- */
function exportCurrentPageAsHtml(filename = "index.html") {
    // Clone the whole document
    const clone = document.documentElement.cloneNode(true);

    // Force exported file to open in USER MODE
    const cloneBody = clone.querySelector("body");
    if (cloneBody) {
        cloneBody.classList.add("read-only");
        cloneBody.classList.remove("edit-active", "sidebar-active");
    }

    // Remove any active contenteditable
    clone.querySelectorAll("[contenteditable]").forEach(el => {
        el.setAttribute("contenteditable", "false");
    });

    // Ensure admin-only UI is hidden in exported file (failsafe)
    clone.querySelectorAll("[data-admin-only='true']").forEach(el => {
        el.classList.add("hidden");
        el.setAttribute("style", "display:none;");
    });

    // Make sure links are normalized in the exported HTML
    // (We normalize in the real doc first, then clone includes it)
    // So do it here too in case:
    // NOTE: simplest is to normalize before cloning; we do that on Save.

    const html = "<!DOCTYPE html>\n" + clone.outerHTML;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded", () => {
    // Always start in user mode
    exitEditMode();

    // Normal behaviors
    normalizeEditableLinks();

    // Smooth scroll (safe)
    document.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const href = link.getAttribute("href");

        // Ignore bare "#" (NOT a valid selector)
        if (!href || href === "#") {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
    });

    // ===== Theme Controls (Admin) =====
    (function initThemeControls() {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const themePanel = document.getElementById('theme-panel');

        const primaryInput = document.getElementById('theme-primary');
        const secondaryInput = document.getElementById('theme-secondary');
        const bgInput = document.getElementById('theme-bg');
        const surfaceInput = document.getElementById('theme-surface'); // optional, if present
        const resetBtn = document.getElementById('theme-reset-btn');

        // If your index.html doesn't include these, do nothing (prevents errors)
        if (!primaryInput || !secondaryInput || !bgInput) return;

        const rootStyle = document.documentElement.style;

        function hexToRgb(hex) {
            const h = hex.replace('#', '').trim();
            if (h.length !== 6) return null;
            const r = parseInt(h.slice(0, 2), 16);
            const g = parseInt(h.slice(2, 4), 16);
            const b = parseInt(h.slice(4, 6), 16);
            return { r, g, b };
        }

        function rgbToHex(r, g, b) {
            const toHex = (n) => n.toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        }

        // Small helper so hover colors still look like hover colors
        function lighten(hex, amount = 0.08) {
            const rgb = hexToRgb(hex);
            if (!rgb) return hex;
            const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
            const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
            const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
            return rgbToHex(r, g, b);
        }

        function setVar(name, value) {
            rootStyle.setProperty(name, value);
        }

        function applyTheme(theme) {
            // These variable names match your styles.css variables:contentReference[oaicite:3]{index=3}
            setVar('--color-primary', theme.primary);
            setVar('--color-primary-light', lighten(theme.primary, 0.10));
            setVar('--color-secondary', theme.secondary);

            // "Background" controls the page background (body uses --color-bg-white):contentReference[oaicite:4]{index=4}
            setVar('--color-bg-white', theme.bg);

            // "Surface" controls cards/panels (we make .experience-card use this)
            if (theme.surface) {
                setVar('--color-surface', theme.surface);
            }
        }

        // Defaults should match what you want as “Reset”
        const DEFAULT_THEME = {
            primary: primaryInput.value || '#2C3E50',
            secondary: secondaryInput.value || '#18BC9C',
            bg: bgInput.value || '#FFFFFF',
            surface: surfaceInput ? (surfaceInput.value || '#FFFFFF') : '#FFFFFF'
        };

        // Load saved theme (if you want it persistent)
        let savedTheme = null;
        try {
            savedTheme = JSON.parse(localStorage.getItem('resume_theme') || 'null');
        } catch (e) { }

        if (savedTheme && savedTheme.primary && savedTheme.secondary && savedTheme.bg) {
            // Set pickers to saved values
            primaryInput.value = savedTheme.primary;
            secondaryInput.value = savedTheme.secondary;
            bgInput.value = savedTheme.bg;
            if (surfaceInput && savedTheme.surface) surfaceInput.value = savedTheme.surface;

            applyTheme({
                primary: primaryInput.value,
                secondary: secondaryInput.value,
                bg: bgInput.value,
                surface: surfaceInput ? surfaceInput.value : undefined
            });
        } else {
            // Apply defaults once
            applyTheme(DEFAULT_THEME);
        }

        function syncAndApply() {
            const theme = {
                primary: primaryInput.value,
                secondary: secondaryInput.value,
                bg: bgInput.value,
                surface: surfaceInput ? surfaceInput.value : undefined
            };
            applyTheme(theme);
        }

        // Live updates when you move the picker
        primaryInput.addEventListener('input', syncAndApply);
        secondaryInput.addEventListener('input', syncAndApply);
        bgInput.addEventListener('input', syncAndApply);
        if (surfaceInput) surfaceInput.addEventListener('input', syncAndApply);

        // Theme panel show/hide
        if (themeToggleBtn && themePanel) {
            themeToggleBtn.addEventListener('click', () => {
                themePanel.classList.toggle('hidden');
            });
        }

        // Reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                primaryInput.value = DEFAULT_THEME.primary;
                secondaryInput.value = DEFAULT_THEME.secondary;
                bgInput.value = DEFAULT_THEME.bg;
                if (surfaceInput) surfaceInput.value = DEFAULT_THEME.surface;

                syncAndApply();
            });
        }

        // Save button: persist theme
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const themeToSave = {
                    primary: primaryInput.value,
                    secondary: secondaryInput.value,
                    bg: bgInput.value,
                    surface: surfaceInput ? surfaceInput.value : DEFAULT_THEME.surface
                };
                localStorage.setItem('resume_theme', JSON.stringify(themeToSave));
            });
        }

        // Discard button: revert to last saved theme (or defaults), and DO NOT save anything new
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                let revert = null;
                try {
                    revert = JSON.parse(localStorage.getItem('resume_theme') || 'null');
                } catch (e) { }

                const t = revert && revert.primary ? revert : DEFAULT_THEME;

                primaryInput.value = t.primary;
                secondaryInput.value = t.secondary;
                bgInput.value = t.bg;
                if (surfaceInput) surfaceInput.value = t.surface || DEFAULT_THEME.surface;

                syncAndApply();
            });
        }

        // Preset swatch clicks -> set the linked input and trigger theme update
        document.querySelectorAll(".theme-swatches").forEach(group => {
            const targetId = group.getAttribute("data-target");
            if (!targetId) return;

            group.querySelectorAll(".theme-swatch").forEach(btn => {
                const color = btn.getAttribute("data-color");
                if (!color) return;

                // show the color on the swatch
                btn.style.backgroundColor = color;

                btn.addEventListener("click", () => {
                    const input = document.getElementById(targetId);
                    if (!input) return;

                    input.value = color;

                    // trigger the same logic as manually picking a color
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                });
            });
        });
    })();
});

// Mobile menu
const menuToggle = document.getElementById("mobile-menu");
const navLinks = document.querySelector(".nav-links");
if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
}

// Admin trigger => password prompt
const adminTrigger = document.getElementById("admin-trigger");
if (adminTrigger) {
    adminTrigger.addEventListener("click", (e) => {
        e.preventDefault();

        // If already editing, clicking Admin exits edit mode
        if (document.body.classList.contains("edit-active")) {
            exitEditMode();
            return;
        }

        // Otherwise require password
        openAdminPasswordModal();
    });
}

// Save exports index.html
const saveBtn = document.getElementById("save-btn");
if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        // “Save locally” behavior: normalize links so hrefs are correct
        normalizeEditableLinks();

        // Export snapshot
        exportCurrentPageAsHtml("index.html");

        // Exit edit mode after saving (optional; remove if you want to stay editing)
        exitEditMode();
    });
}

// Discard just reloads
const cancelBtn = document.getElementById("cancel-btn");
if (cancelBtn) {
    cancelBtn.addEventListener("click", () => location.reload());
}

// ===== Admin Unlock (Password-only) =====
// Paste this at the VERY BOTTOM of script.js

(function () {
    const ADMIN_PASSWORD = "Password-M-Z-A";

    // Elements (only run if they exist)
    const adminTrigger = document.getElementById("admin-trigger");
    const authModal = document.getElementById("auth-modal");
    const authClose = document.getElementById("auth-close");
    const authTitle = document.getElementById("auth-title");
    const authForm = document.getElementById("auth-form");
    const authSubmit = document.getElementById("auth-submit");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const adminBar = document.getElementById("admin-bar");

    // If your file doesn’t have these, don’t crash
    if (!adminTrigger || !authModal || !authForm || !passwordInput) return;

    // Find the wrapper div that contains the Email label+input (so we can hide it)
    // In your HTML it is: <div class="form-group"> ... email ... </div>
    const emailFormGroup = emailInput ? emailInput.closest(".form-group") : null;

    function openUnlockModal() {
        // Show modal
        authModal.classList.remove("hidden");

        // Change title + button text to match admin mode
        if (authTitle) authTitle.textContent = "Unlock Edit Mode";
        if (authSubmit) authSubmit.textContent = "Unlock Edit Mode";

        // Hide email field + remove required so the form can submit with ONLY password
        if (emailFormGroup) emailFormGroup.style.display = "none";
        if (emailInput) {
            emailInput.required = false;
            emailInput.value = "";
        }

        // Clear password field each time
        passwordInput.value = "";
        passwordInput.focus();
    }

    function closeUnlockModal() {
        authModal.classList.add("hidden");

        // Put email field back (so normal login still works later if you want it)
        if (emailFormGroup) emailFormGroup.style.display = "";
        if (emailInput) emailInput.required = true;
    }

    function enableEditMode() {
        // Mark editing state
        document.documentElement.classList.add("edit-mode");
        document.body.classList.add("edit-mode");

        // Show admin bar (important: remove inline display:none)
        if (adminBar) {
            adminBar.classList.remove("hidden");
            adminBar.style.display = ""; // remove display:none so CSS can show it
        }

        // Show any admin-only elements (and remove inline display:none if present)
        document.querySelectorAll('[data-admin-only="true"]').forEach((el) => {
            el.style.display = ""; // undo any inline style="display:none"
            el.classList.remove("hidden");
        });

        // (Optional) allow editing if your template uses data-editable
        document.querySelectorAll("[data-editable='true']").forEach((el) => {
            el.setAttribute("contenteditable", "true");
        });

        // Make sure editable links are clickable after editing (common issue)
        document.querySelectorAll("[data-editable-link='true']").forEach((a) => {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
        });
    }

    // Click "Admin" -> open password modal
    adminTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        openUnlockModal();
    });

    // Close modal (X)
    if (authClose) authClose.addEventListener("click", closeUnlockModal);

    // Click outside modal to close
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeUnlockModal();
    });

    // Submit password
    authForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const pw = (passwordInput.value || "").trim();

        if (pw === ADMIN_PASSWORD) {
            closeUnlockModal();
            enableEditMode();
        } else {
            alert("Wrong password.");
            passwordInput.focus();
            passwordInput.select();
        }
    });
})();

/* ============================
   THEME: live CSS variable editing
   (safe even if buttons are removed)
   ============================ */
function initThemeControls() {
    const root = document.documentElement;

    // Map input IDs -> CSS variables that ACTUALLY exist in styles.css (:root)
    const bindings = [
        ["theme-primary", "--color-primary"],
        ["theme-primary-text", "--color-on-primary"],

        ["theme-accent", "--color-secondary"],
        ["theme-accent-text", "--color-on-secondary"],

        ["theme-background", "--color-bg-white"],
        ["theme-background-text", "--color-on-bg"],

        ["theme-cards", "--color-surface"],
        ["theme-cards-text", "--color-on-surface"],

        ["theme-experience-bg", "--color-experience-bg"],
    ];

    // Load saved theme (if any)
    try {
        const saved = JSON.parse(localStorage.getItem("cc_theme_v2") || "{}");
        for (const [_, cssVar] of bindings) {
            if (saved[cssVar]) root.style.setProperty(cssVar, saved[cssVar]);
        }
    } catch (_) { }

    // Sync pickers to current computed values (so UI matches reality)
    const computed = getComputedStyle(root);
    for (const [id, cssVar] of bindings) {
        const input = document.getElementById(id);
        if (!input) continue;
        const current = computed.getPropertyValue(cssVar).trim();
        if (current) input.value = current;
    }

    // Save helper
    const saveTheme = () => {
        const data = {};
        for (const [_, cssVar] of bindings) {
            data[cssVar] = getComputedStyle(root).getPropertyValue(cssVar).trim();
        }
        localStorage.setItem("cc_theme_v2", JSON.stringify(data));
    };

    // Live updates
    for (const [id, cssVar] of bindings) {
        const input = document.getElementById(id);
        if (!input) continue;

        input.addEventListener("input", (e) => {
            const val = e.target.value;

            // Update the main variable
            root.style.setProperty(cssVar, val);

            // ALSO update legacy text variables (this is the missing piece)
            if (cssVar === "--color-on-bg") {
                root.style.setProperty("--color-text-main", val);
                root.style.setProperty("--color-text-light", val);
            }

            if (cssVar === "--color-on-primary") {
                root.style.setProperty("--color-text-white", val);
            }

            saveTheme();
        });
    }

    // Reset button
    const resetBtn = document.getElementById("theme-reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            localStorage.removeItem("cc_theme_v2");
            // remove inline overrides so :root defaults apply again
            for (const [_, cssVar] of bindings) root.style.removeProperty(cssVar);

            // resync UI pickers to defaults
            const computed2 = getComputedStyle(root);
            for (const [id, cssVar] of bindings) {
                const input = document.getElementById(id);
                if (!input) continue;
                const current = computed2.getPropertyValue(cssVar).trim();
                if (current) input.value = current;
            }
        });
    }
}

// Make sure it runs after DOM is ready
document.addEventListener("DOMContentLoaded", initThemeControls);


// --- Admin trigger: toggle edit mode (required for admin UI to show) ---
(() => {
    const adminTrigger = document.getElementById('admin-trigger');
    if (!adminTrigger) return;

    adminTrigger.addEventListener('click', (e) => {
        e.preventDefault();

        // Toggle classes used by your CSS rules
        document.body.classList.toggle('edit-active');
        document.body.classList.toggle('read-only');

        // Optional: close theme panel when leaving edit mode
        if (!document.body.classList.contains('edit-active')) {
            const themePanel = document.getElementById('theme-panel');
            themePanel?.classList.add('hidden');
        }
    });
})();