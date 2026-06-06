import React from 'react';
import { useTasks } from '../context/TaskContext';
import * as Icons from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { tasks, categories, openEditTaskDrawer } = useTasks();
  const today = new Date().toISOString().split('T')[0];

  // Calculations for stats
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.dueDate < today && t.status !== 'done').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Circular progress ring calculations
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Get motivational quote/text
  const getMotivationText = () => {
    if (totalTasks === 0) return 'Bắt đầu ngày mới bằng cách tạo công việc đầu tiên của bạn!';
    if (completionRate === 100) return 'Tuyệt vời! Bạn đã hoàn thành tất cả các mục tiêu đề ra! 🎉';
    if (completionRate >= 75) return 'Gần hoàn thành rồi! Chỉ còn một vài công việc nữa thôi.';
    if (completionRate >= 50) return 'Tuyệt! Bạn đã đi được nửa chặng đường rồi.';
    if (completionRate >= 25) return 'Đang đi đúng hướng rồi, cố gắng duy trì tiến độ nhé!';
    return 'Bắt đầu hành động để giải quyết các công việc hôm nay nào!';
  };

  // Get urgent tasks: Overdue or High priority and not completed
  const getUrgentTasks = () => {
    const incomplete = tasks.filter(t => t.status !== 'done');
    
    // Sort logic: Overdue first, then High priority, then Medium
    return incomplete
      .sort((a, b) => {
        const aOverdue = a.dueDate < today;
        const bOverdue = b.dueDate < today;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      })
      .slice(0, 3);
  };

  const urgentTasks = getUrgentTasks();

  // Get category stats
  const getCategoryStats = () => {
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat.id);
      const total = catTasks.length;
      const completed = catTasks.filter(t => t.status === 'done').length;
      const incomplete = total - completed;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        ...cat,
        total,
        completed,
        incomplete,
        rate
      };
    });
  };

  const categoryStats = getCategoryStats();

  const priorityLabels = {
    high: 'Cao',
    medium: 'T.Bình',
    low: 'Thấp'
  };

  return (
    <div className="dashboard">
      {/* 4 Stats Cards Grid */}
      <section className="stats-grid animate-fade-in">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Tổng công việc</span>
            <span className="stat-value">{totalTasks}</span>
          </div>
          <div className="stat-icon-wrapper total">
            <Icons.Layers size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Đang thực hiện</span>
            <span className="stat-value">{inProgressTasks}</span>
          </div>
          <div className="stat-icon-wrapper progress">
            <Icons.PlayCircle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Công việc quá hạn</span>
            <span className="stat-value" style={{ color: overdueTasks > 0 ? 'var(--priority-high)' : '' }}>
              {overdueTasks}
            </span>
          </div>
          <div className="stat-icon-wrapper overdue">
            <Icons.AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Đã hoàn thành</span>
            <span className="stat-value">{completedTasks}</span>
          </div>
          <div className="stat-icon-wrapper completed">
            <Icons.CheckCircle2 size={22} />
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="dashboard-layout animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {/* Left Column: Progress Ring & Overdue lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Progress Ring panel */}
          <div className="dashboard-panel">
            <h3 className="panel-title">
              <Icons.TrendingUp size={18} />
              <span>Tiến độ tổng thể</span>
            </h3>
            
            <div className="progress-ring-container">
              <div className="progress-ring-wrapper">
                <svg width="130" height="130" className="progress-ring">
                  {/* Background track circle */}
                  <circle
                    className="progress-ring-track"
                    stroke="var(--border-color)"
                    strokeWidth="10"
                    fill="transparent"
                    r={radius}
                    cx="65"
                    cy="65"
                  />
                  {/* Foreground progress circle */}
                  <circle
                    className="progress-ring-circle"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="65"
                    cy="65"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="progress-ring-text-center">
                  <span className="progress-pct">{completionRate}%</span>
                  <span className="progress-lbl">Hoàn thành</span>
                </div>
              </div>
              
              <p className="progress-motivation">{getMotivationText()}</p>
            </div>
          </div>

          {/* Urgent / Overdue Tasks panel */}
          <div className="dashboard-panel">
            <h3 className="panel-title">
              <Icons.AlertOctagon size={18} />
              <span>Công việc khẩn cấp / Cần làm ngay</span>
            </h3>
            
            <div className="recent-tasks-list">
              {urgentTasks.length > 0 ? (
                urgentTasks.map(task => {
                  const isOverdue = task.dueDate < today;
                  return (
                    <div
                      key={task.id}
                      className="recent-task-item"
                      onClick={() => openEditTaskDrawer(task)}
                    >
                      <div className="recent-task-left">
                        <span className="recent-task-title">{task.title}</span>
                        <div className="recent-task-meta">
                          <span className={`badge priority-${task.priority}`} style={{ transform: 'scale(0.85)', transformOrigin: 'left center', padding: '2px 6px' }}>
                            {priorityLabels[task.priority]}
                          </span>
                          <span style={{ color: isOverdue ? 'var(--priority-high)' : '' }}>
                            Hạn: {task.dueDate === today ? 'Hôm nay' : task.dueDate}
                          </span>
                        </div>
                      </div>
                      
                      <div className="recent-task-right">
                        <span className={`status-badge status-${task.status}`}>
                          {task.status === 'todo' ? 'Cần làm' : 'Đang làm'}
                        </span>
                        <Icons.ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '24px 0' }}>
                  Tuyệt vời! Không có công việc khẩn cấp nào.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Categories statistics list */}
        <div className="dashboard-panel">
          <h3 className="panel-title">
            <Icons.FolderDot size={18} />
            <span>Thống kê theo Dự án / Danh mục</span>
          </h3>
          
          <div className="cat-dist-list">
            {categoryStats.map(cat => (
              <div key={cat.id} className="cat-dist-item">
                <div className="cat-dist-info">
                  <div className="cat-dist-name">
                    <span className={`cat-dot cat-${cat.color}`}></span>
                    <span>{cat.name}</span>
                  </div>
                  <span className="cat-dist-count">
                    {cat.completed}/{cat.total} ({cat.rate}%)
                  </span>
                </div>
                <div className="cat-bar-bg">
                  <div
                    className="cat-bar-fill"
                    style={{
                      width: `${cat.rate}%`,
                      backgroundColor: `var(--cat-${cat.color})`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
