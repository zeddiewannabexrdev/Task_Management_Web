import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import * as Icons from 'lucide-react';
import './Header.css';

export default function Header() {
  const {
    searchQuery,
    setSearchQuery,
    openNewTaskDrawer,
    tasks,
  } = useTasks();

  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng, Admin! ☀️';
    if (hour < 18) return 'Chào buổi chiều, Admin! 🌤️';
    return 'Chào buổi tối, Admin! 🌙';
  };

  // Get Vietnamese formatted date
  const getVietnameseDate = () => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${dayName}, ngày ${date}/${month}/${year}`;
  };

  // Get overdue tasks as notifications
  const getOverdueTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate < today && task.status !== 'done');
  };

  const overdueTasks = getOverdueTasks();

  return (
    <header className="header glass">
      {/* Greeting and Current Date */}
      <div className="header-left">
        <span className="header-greeting">{getGreeting()}</span>
        <span className="header-date">{getVietnameseDate()}</span>
      </div>

      {/* Task Search Bar */}
      <div className="header-search">
        <Icons.Search className="search-icon" size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm công việc..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Actions: Notifications & Create Task button */}
      <div className="header-actions" ref={dropdownRef}>
        <div className="notification-container">
          <button
            className={`btn-icon ${showNotif ? 'active' : ''}`}
            onClick={() => setShowNotif(!showNotif)}
            title="Thông báo"
          >
            <Icons.Bell size={18} />
            {overdueTasks.length > 0 && <span className="notification-badge"></span>}
          </button>

          {/* Overdue Task Notifications Dropdown */}
          {showNotif && (
            <div className="notification-dropdown">
              <div className="notif-header">Thông báo quan trọng</div>
              <div className="notif-list">
                {overdueTasks.length > 0 ? (
                  overdueTasks.map(task => (
                    <div key={task.id} className="notif-item">
                      <Icons.AlertTriangle className="notif-item-icon" size={14} />
                      <div className="notif-item-text">
                        <span className="notif-title">{task.title}</span>
                        <span>Đã quá hạn chót ({task.dueDate})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">Không có thông báo mới</div>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={() => openNewTaskDrawer('todo')}>
          <Icons.Plus size={16} strokeWidth={2.5} />
          <span>Tạo công việc</span>
        </button>
      </div>
    </header>
  );
}
