import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import * as Icons from 'lucide-react';
import './TaskDrawer.css';

export default function TaskDrawer() {
  const {
    isDrawerOpen,
    editingTask,
    categories,
    closeDrawer,
    addTask,
    updateTask,
    deleteTask
  } = useTasks();

  // Form local states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  
  // Input state for adding new subtasks
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [error, setError] = useState('');

  // Load editing task into form states
  useEffect(() => {
    if (editingTask) {
      if (editingTask.id) {
        // Edit Mode
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setStatus(editingTask.status);
        setPriority(editingTask.priority);
        setCategory(editingTask.category);
        setDueDate(editingTask.dueDate);
        setSubtasks(editingTask.subtasks || []);
      } else {
        // Create Mode
        setTitle('');
        setDescription('');
        setStatus(editingTask.status || 'todo');
        setPriority('medium');
        setCategory(categories[0]?.id || 'work');
        setDueDate(new Date().toISOString().split('T')[0]);
        setSubtasks([]);
      }
      setError('');
    }
  }, [editingTask, categories]);

  if (!isDrawerOpen) return null;

  // Handle local subtask checkbox click
  const handleToggleLocalSubtask = (subId) => {
    setSubtasks(prev =>
      prev.map(sub => sub.id === subId ? { ...sub, completed: !sub.completed } : sub)
    );
  };

  // Add subtask locally
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (newSubtaskText.trim()) {
      const newSub = {
        id: `sub-${Date.now()}`,
        text: newSubtaskText.trim(),
        completed: false
      };
      setSubtasks(prev => [...prev, newSub]);
      setNewSubtaskText('');
    }
  };

  // Delete subtask locally
  const handleDeleteSubtask = (subId) => {
    setSubtasks(prev => prev.filter(sub => sub.id !== subId));
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Vui lòng điền tiêu đề công việc');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      category,
      dueDate,
      subtasks
    };

    if (editingTask && editingTask.id) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    
    closeDrawer();
  };

  const isEditMode = !!(editingTask && editingTask.id);

  return (
    <div className="drawer-overlay" onClick={closeDrawer}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <h3 className="drawer-title">
            {isEditMode ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
          </h3>
          <button className="drawer-close-btn" onClick={closeDrawer} title="Đóng">
            <Icons.X size={20} />
          </button>
        </div>

        {/* Form */}
        <form className="drawer-form" onSubmit={handleSubmit}>
          {/* Title input */}
          <div className="form-group">
            <label className="form-label">Tiêu đề công việc *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Lập kế hoạch kinh doanh..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
            />
            {error && <span style={{ color: 'var(--priority-high)', fontSize: '0.75rem', fontWeight: 500 }}>{error}</span>}
          </div>

          {/* Description textarea */}
          <div className="form-group">
            <label className="form-label">Mô tả chi tiết</label>
            <textarea
              className="form-textarea"
              placeholder="Mô tả các bước thực hiện, ghi chú bổ sung..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category selection */}
          <div className="form-group">
            <label className="form-label">Dự án / Danh mục</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status selection */}
          <div className="form-group">
            <label className="form-label">Trạng thái hiện tại</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todo">Cần làm</option>
              <option value="inprogress">Đang làm</option>
              <option value="inreview">Đang duyệt</option>
              <option value="done">Đã hoàn thành</option>
            </select>
          </div>

          {/* Priority selector button tabs */}
          <div className="form-group">
            <label className="form-label">Mức độ ưu tiên</label>
            <div className="priority-selector">
              <button
                type="button"
                className={`priority-option ${priority === 'low' ? 'selected low' : ''}`}
                onClick={() => setPriority('low')}
              >
                Thấp
              </button>
              <button
                type="button"
                className={`priority-option ${priority === 'medium' ? 'selected medium' : ''}`}
                onClick={() => setPriority('medium')}
              >
                Trung bình
              </button>
              <button
                type="button"
                className={`priority-option ${priority === 'high' ? 'selected high' : ''}`}
                onClick={() => setPriority('high')}
              >
                Cao
              </button>
            </div>
          </div>

          {/* Due date input */}
          <div className="form-group">
            <label className="form-label">Hạn chót hoàn thành</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Subtask Manager */}
          <div className="subtasks-section">
            <label className="form-label">Công việc con ({subtasks.length})</label>
            
            {/* List current subtasks */}
            {subtasks.length > 0 && (
              <div className="subtask-list">
                {subtasks.map(sub => (
                  <div key={sub.id} className="subtask-item">
                    <div className="subtask-item-left">
                      <button
                        type="button"
                        className={`subtask-checkbox ${sub.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleLocalSubtask(sub.id)}
                      >
                        <Icons.Check size={8} strokeWidth={4} />
                      </button>
                      <span className={`subtask-text ${sub.completed ? 'completed' : ''}`}>
                        {sub.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="action-btn delete"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      title="Xóa công việc con"
                    >
                      <Icons.Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add new subtask */}
            <div className="subtask-input-container">
              <input
                type="text"
                className="subtask-input"
                placeholder="Thêm công việc con mới..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                className="subtask-add-btn"
                onClick={handleAddSubtask}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="drawer-actions">
            {isEditMode && (
              <button
                type="button"
                className="btn-danger-light"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                    deleteTask(editingTask.id);
                  }
                }}
              >
                <Icons.Trash2 size={16} />
                <span>Xóa</span>
              </button>
            )}

            <div className="drawer-actions-right">
              <button type="button" className="btn-secondary" onClick={closeDrawer}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-primary">
                <Icons.Save size={16} />
                <span>{isEditMode ? 'Lưu lại' : 'Tạo mới'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
