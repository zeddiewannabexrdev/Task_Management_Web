import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from './TaskCard';
import * as Icons from 'lucide-react';
import './TaskBoard.css';

export default function TaskBoard() {
  const {
    filteredTasks,
    categories,
    updateTask,
    deleteTask,
    openNewTaskDrawer,
    openEditTaskDrawer,
    priorityFilter,
    setPriorityFilter,
    dateFilter,
    setDateFilter,
  } = useTasks();

  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  const [activeDragCol, setActiveDragCol] = useState(null); // column id currently being dragged over

  const today = new Date().toISOString().split('T')[0];

  // Kanban Columns Definition
  const columns = [
    { id: 'todo', title: 'Cần làm', dotClass: 'todo' },
    { id: 'inprogress', title: 'Đang làm', dotClass: 'inprogress' },
    { id: 'inreview', title: 'Đang duyệt', dotClass: 'inreview' },
    { id: 'done', title: 'Đã hoàn thành', dotClass: 'done' },
  ];

  // Drag and Drop event handlers
  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (activeDragCol !== colId) {
      setActiveDragCol(colId);
    }
  };

  const handleDragLeave = () => {
    setActiveDragCol(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { status: colId });
    }
    setActiveDragCol(null);
  };

  // Toggle quick complete for lists
  const handleToggleCompleteList = (e, task) => {
    e.stopPropagation();
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask(task.id, { status: nextStatus });
  };

  const isFiltersActive = priorityFilter !== 'all' || dateFilter !== 'all';

  const handleClearFilters = () => {
    setPriorityFilter('all');
    setDateFilter('all');
  };

  // Helper to format due date labels for List
  const formatListDate = (dueDate, status) => {
    const isDone = status === 'done';
    if (isDone) return { label: dueDate, className: 'done' };

    if (dueDate === today) return { label: 'Hôm nay', className: 'today' };
    
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];
    if (dueDate === tomorrow) return { label: 'Ngày mai', className: 'future' };

    if (dueDate < today) return { label: `Quá hạn (${dueDate})`, className: 'overdue' };
    
    return { label: dueDate, className: 'future' };
  };

  // Translate Priority labels
  const priorityLabels = {
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp'
  };

  // Translate Status labels
  const statusLabels = {
    todo: 'Cần làm',
    inprogress: 'Đang làm',
    inreview: 'Đang duyệt',
    done: 'Đã xong'
  };

  return (
    <div className="board-container">
      {/* Board controls: Layout toggle & filters */}
      <div className="board-header">
        <div className="board-header-left">
          {/* Toggle buttons between Kanban and List views */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Bảng Kanban"
            >
              <Icons.KanbanSquare size={15} />
              <span>Bảng</span>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Danh sách hàng dọc"
            >
              <Icons.List size={15} />
              <span>Danh sách</span>
            </button>
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div className="board-filters">
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Mọi độ ưu tiên</option>
            <option value="high">Ưu tiên Cao</option>
            <option value="medium">Ưu tiên Trung bình</option>
            <option value="low">Ưu tiên Thấp</option>
          </select>

          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Mọi thời hạn</option>
            <option value="today">Hôm nay</option>
            <option value="week">Trong 7 ngày tới</option>
            <option value="overdue">Quá hạn</option>
          </select>

          {isFiltersActive && (
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              <Icons.X size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div className="kanban-grid">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(task => task.status === col.id);
            const isDragOver = activeDragCol === col.id;

            return (
              <div
                key={col.id}
                className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column header */}
                <div className="column-header">
                  <div className="column-title">
                    <span className={`column-title-dot ${col.dotClass}`}></span>
                    <span>{col.title}</span>
                  </div>
                  <span className="column-count">{colTasks.length}</span>
                </div>

                {/* Task list container */}
                <div className="column-tasks">
                  {colTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '32px 0', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      Kéo thả hoặc tạo việc vào đây
                    </div>
                  )}
                </div>

                {/* Quick Add Button */}
                <button
                  className="column-add-btn"
                  onClick={() => openNewTaskDrawer(col.id)}
                >
                  <Icons.Plus size={14} />
                  <span>Thêm công việc</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Table layout) */
        <div className="list-view-container">
          <table className="list-table">
            <thead>
              <tr className="list-table-header">
                <th>Tiêu đề công việc</th>
                <th>Dự án</th>
                <th>Mức ưu tiên</th>
                <th>Hạn chót</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody className="list-table-body">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => {
                  const cat = categories.find(c => c.id === task.category) || { name: 'Mặc định', color: 'other' };
                  const isDone = task.status === 'done';
                  const dateInfo = formatListDate(task.dueDate, task.status);

                  return (
                    <tr
                      key={task.id}
                      className="list-table-row"
                      onClick={() => openEditTaskDrawer(task)}
                    >
                      {/* Checkbox and title */}
                      <td className="row-title-container">
                        <button
                          className={`row-checkbox ${isDone ? 'checked' : ''}`}
                          onClick={(e) => handleToggleCompleteList(e, task)}
                          title={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
                        >
                          <Icons.Check size={8} strokeWidth={4} />
                        </button>
                        <span className={`row-title ${isDone ? 'completed' : ''}`}>
                          {task.title}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="row-category">
                        <span className={`cat-dot cat-${cat.color}`}></span>
                        <span>{cat.name}</span>
                      </td>

                      {/* Priority */}
                      <td>
                        <span className={`badge priority-${task.priority}`} style={{ scale: '0.9', transformOrigin: 'left center' }}>
                          {priorityLabels[task.priority]}
                        </span>
                      </td>

                      {/* Due date */}
                      <td className={`row-due-date ${dateInfo.className}`}>
                        <span>{dateInfo.label}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge status-${task.status}`}>
                          {statusLabels[task.status]}
                        </span>
                      </td>

                      {/* Quick action buttons */}
                      <td className="list-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="action-btn"
                          onClick={() => openEditTaskDrawer(task)}
                          title="Chỉnh sửa"
                        >
                          <Icons.Edit3 size={14} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                              deleteTask(task.id);
                            }
                          }}
                          title="Xóa công việc"
                        >
                          <Icons.Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: '0.85rem' }}>
                    Không tìm thấy công việc nào thỏa mãn bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
