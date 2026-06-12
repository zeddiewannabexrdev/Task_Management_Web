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
};
