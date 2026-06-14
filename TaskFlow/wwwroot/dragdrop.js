// TaskFlow — Minimal JS Interop for drag-drop + theme persistence
window.taskFlow = {
    // ── Drag & Drop ──────────────────────────────────────────────────────────
    _dragId: null,
    setDragId: (id) => { window.taskFlow._dragId = id; },
    getDragId: () => window.taskFlow._dragId ?? '',

    // ── Theme ────────────────────────────────────────────────────────────────
    setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('taskflow_theme', theme);
    },
    getTheme: () => localStorage.getItem('taskflow_theme') || 'dark',

    // ── Auto Resize Textarea ─────────────────────────────────────────────────
    autoResizeTextarea: (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }
};

document.addEventListener('input', function (e) {
    if (e.target.tagName.toLowerCase() === 'textarea' && e.target.classList.contains('auto-resize')) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    }
});
