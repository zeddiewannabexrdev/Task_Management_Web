import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import * as Icons from 'lucide-react';
import './Sidebar.css';

// Helper component to render Lucide icons dynamically
const LucideIcon = ({ name, className, size = 18 }) => {
  const IconComponent = Icons[name] || Icons.FolderOpen;
  return <IconComponent className={className} size={size} />;
};

export default function Sidebar() {
  const {
    tasks,
    categories,
    theme,
    currentView,
    currentCategoryFilter,
    toggleTheme,
    setCurrentView,
    setCurrentCategoryFilter,
    addCategory,
  } = useTasks();

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Count active (incomplete) tasks for a category
  const getActiveTaskCount = (catId) => {
    return tasks.filter(task => {
      const matchCat = catId === 'all' || task.category === catId;
      return matchCat && task.status !== 'done';
    }).length;
  };

  const handleAddCatSubmit = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
      setShowAddCat(false);
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand logo */}
      <div className="sidebar-logo">
        <Icons.CheckSquare className="logo-icon" size={26} strokeWidth={2.5} />
        <span>TaskFlow</span>
      </div>

      {/* Primary Navigation Views */}
      <nav className="sidebar-menu">
        <button
          className={`menu-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <Icons.LayoutDashboard size={18} />
          <span>Tổng quan</span>
        </button>

        <button
          className={`menu-item ${currentView === 'board' ? 'active' : ''}`}
          onClick={() => setCurrentView('board')}
        >
          <Icons.KanbanSquare size={18} />
          <span>Bảng Kanban</span>
        </button>
      </nav>

      {/* Category / Project List Section */}
      <div className="cat-section-header">
        <span>Dự án / Danh mục</span>
        <button
          className="add-cat-btn"
          onClick={() => setShowAddCat(!showAddCat)}
          title="Thêm danh mục mới"
        >
          <Icons.Plus size={16} />
        </button>
      </div>

      {/* Inline Category Creation Form */}
      {showAddCat && (
        <form className="new-cat-form" onSubmit={handleAddCatSubmit}>
          <input
            type="text"
            className="new-cat-input"
            placeholder="Tên danh mục..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="new-cat-submit" title="Xác nhận">
            <Icons.Check size={14} />
          </button>
          <button
            type="button"
            className="new-cat-cancel"
            onClick={() => {
              setShowAddCat(false);
              setNewCatName('');
            }}
            title="Hủy"
          >
            <Icons.X size={14} />
          </button>
        </form>
      )}

      {/* Category Selection List */}
      <div className="cat-list">
        <button
          className={`cat-item ${currentCategoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setCurrentCategoryFilter('all');
            // Auto switch to Kanban/List if on Dashboard and filtering?
            // Usually, dashboard filters work on dashboard too, so keeping view is fine.
          }}
        >
          <div className="cat-item-left">
            <Icons.Grid size={16} />
            <span>Tất cả</span>
          </div>
          <span className="cat-count">{getActiveTaskCount('all')}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-item ${currentCategoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCurrentCategoryFilter(cat.id)}
          >
            <div className="cat-item-left">
              <span className={`cat-dot cat-${cat.color}`}></span>
              <span>{cat.name}</span>
            </div>
            <span className="cat-count">{getActiveTaskCount(cat.id)}</span>
          </button>
        ))}
      </div>

      {/* Sidebar Footer: Theme and User profile */}
      <div className="sidebar-footer">
        <div className="theme-toggle">
          <span>{theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
          <button
            className="toggle-switch"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <div className="toggle-knob">
              {theme === 'dark' ? <Icons.Moon size={12} /> : <Icons.Sun size={12} />}
            </div>
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">
            <span>AD</span>
          </div>
          <div className="user-info">
            <span className="user-name">ADMIN</span>
            <span className="user-role">Quản lý</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
