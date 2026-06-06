import React from 'react';
import { useTasks } from '../context/TaskContext';
import * as Icons from 'lucide-react';
import './TaskCard.css';

export default function TaskCard({ task }) {
  const {
    categories,
    updateTask,
    deleteTask,
    openEditTaskDrawer
  } = useTasks();

  // Find category details for the task
  const categoryDetails = categories.find(c => c.id === task.category) || {
    name: 'Mặc định',
    color: 'other'
  };

  const isCompleted = task.status === 'done';

  // Toggle task complete status quickly
  const handleToggleComplete = (e) => {
    e.stopPropagation(); // Avoid triggering any card click
    const nextStatus = isCompleted ? 'todo' : 'done';
    updateTask(task.id, { status: nextStatus });
  };

  // Drag start handler
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Subtask progress calculation
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const subtaskPercentage = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : 0;

  // Format due date dynamically
  const getDueDateLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (task.dueDate === today) return 'Hôm nay';
    if (task.dueDate === tomorrow) return 'Ngày mai';
    if (task.dueDate === yesterday) return 'Hôm qua';

    // Format YYYY-MM-DD to DD/MM/YYYY for display
    const parts = task.dueDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return task.dueDate;
  };

  // Get CSS class based on due date urgency
  const getDueDateClass = () => {
    if (isCompleted) return 'done';
    
    const today = new Date().toISOString().split('T')[0];
    if (task.dueDate < today) return 'overdue';
    if (task.dueDate === today) return 'today';
    return 'future';
  };

  const dueDateClass = getDueDateClass();
  const dueDateLabel = getDueDateLabel();

  // Mapping priority translation
  const priorityLabels = {
    high: 'Cao',
    medium: 'T.Bình',
    low: 'Thấp'
  };

  return (
    <div
      className={`task-card ${isCompleted ? 'done-state' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onClick={() => openEditTaskDrawer(task)}
    >
      {/* Category Info */}
      <div className="task-card-header">
        <div className="task-card-cat-row">
          <span className={`cat-dot cat-${categoryDetails.color}`}></span>
          <span>{categoryDetails.name}</span>
        </div>
        
        {/* Priority Badge */}
        <span className={`badge priority-${task.priority}`}>
          {priorityLabels[task.priority]}
        </span>
      </div>

      {/* Checkbox + Task Title */}
      <div className="task-card-title-row">
        <button
          className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
          onClick={handleToggleComplete}
          title={isCompleted ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
        >
          <Icons.Check size={10} strokeWidth={3} />
        </button>
        <h4 className={`task-title ${isCompleted ? 'completed' : ''}`}>
          {task.title}
        </h4>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="task-subtasks-progress">
          <div className="progress-text">
            <span>Tiến độ con</span>
            <span>{completedSubtasks}/{totalSubtasks} ({subtaskPercentage}%)</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${subtaskPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Card Footer: Due Date & Actions */}
      <div className="task-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className={`due-date-display ${dueDateClass}`}>
          {dueDateClass === 'overdue' ? (
            <Icons.AlertTriangle size={13} />
          ) : (
            <Icons.Calendar size={13} />
          )}
          <span>{dueDateLabel}</span>
        </div>

        <div className="task-actions">
          <button
            className="action-btn"
            onClick={() => openEditTaskDrawer(task)}
            title="Chỉnh sửa"
          >
            <Icons.Edit3 size={14} />
          </button>
          
          <button
            className="action-btn delete"
            onClick={() => deleteTask(task.id)}
            title="Xóa công việc"
          >
            <Icons.Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
