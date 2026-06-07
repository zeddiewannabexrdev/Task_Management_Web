import React, { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const TaskContext = createContext();

// Tự động dùng URL từ .env (local) hoặc .env.production (GitHub Pages)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Client-side visual settings (kept in local storage for user preference)
  const [theme, setTheme] = useLocalStorage('app_theme', 'light');
  const [currentView, setCurrentView] = useLocalStorage('current_view', 'dashboard');
  
  // Filtering & searching states (non-persistent)
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Drawer state for Create / Edit task
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null means adding a new task

  // Toggle theme HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 1. Fetch categories and tasks from C# Backend on mount
  useEffect(() => {
    async function initData() {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const resCat = await fetch(`${API_BASE_URL}/categories`);
        if (resCat.ok) {
          const dataCat = await resCat.json();
          setCategories(dataCat);
        }

        // Fetch tasks
        const resTasks = await fetch(`${API_BASE_URL}/tasks`);
        if (resTasks.ok) {
          const dataTasks = await resTasks.json();
          // Map backend `categoryId` to frontend `category` to avoid rewriting components
          const mappedTasks = dataTasks.map(t => ({
            ...t,
            category: t.categoryId
          }));
          setTasks(mappedTasks);
        }
      } catch (error) {
        console.error('Error fetching data from C# API:', error);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // 2. Add task via POST API
  const addTask = async (taskData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          categoryId: taskData.category,
          dueDate: taskData.dueDate,
          subtasks: taskData.subtasks || []
        })
      });
      
      if (res.ok) {
        const createdTask = await res.json();
        // Map categoryId to category
        const mappedTask = {
          ...createdTask,
          category: createdTask.categoryId
        };
        setTasks(prevTasks => [mappedTask, ...prevTasks]);
      }
    } catch (error) {
      console.error('Error adding task to backend:', error);
    }
  };

  // 3. Update task details or status via PUT/PATCH API
  const updateTask = async (taskId, updatedFields) => {
    // Check if only status is being updated (fast drag-and-drop path)
    const keys = Object.keys(updatedFields);
    if (keys.length === 1 && keys[0] === 'status') {
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: updatedFields.status })
        });
        if (res.ok) {
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === taskId ? { ...task, status: updatedFields.status } : task))
          );
        }
      } catch (error) {
        console.error('Error patching task status:', error);
      }
      return;
    }

    // Full task update path (PUT)
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;
    
    // Merge existing and new fields
    const mergedTask = { ...currentTask, ...updatedFields };

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mergedTask.title,
          description: mergedTask.description,
          status: mergedTask.status,
          priority: mergedTask.priority,
          categoryId: mergedTask.category,
          dueDate: mergedTask.dueDate,
          subtasks: mergedTask.subtasks || []
        })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        const mappedTask = {
          ...updatedTask,
          category: updatedTask.categoryId
        };
        setTasks(prevTasks =>
          prevTasks.map(t => (t.id === taskId ? mappedTask : t))
        );
      }
    } catch (error) {
      console.error('Error updating task in backend:', error);
    }
  };

  // 4. Delete task via DELETE API
  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        if (editingTask && editingTask.id === taskId) {
          closeDrawer();
        }
      }
    } catch (error) {
      console.error('Error deleting task in backend:', error);
    }
  };

  // 5. Toggle subtask local state helper (syncs to backend on form save)
  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id !== taskId) return task;
        const updatedSubtasks = task.subtasks.map(sub =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        return { ...task, subtasks: updatedSubtasks };
      })
    );
  };

  // 6. Add category via POST API
  const addCategory = async (categoryName) => {
    const id = categoryName.toLowerCase().replace(/\s+/g, '-');
    if (categories.some(c => c.id === id)) return;
    
    const colors = ['work', 'personal', 'shopping', 'fitness', 'other'];
    const assignedColor = colors[categories.length % colors.length];
    
    const newCategory = {
      id,
      name: categoryName,
      color: assignedColor,
      icon: 'FolderOpen'
    };

    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      if (res.ok) {
        const createdCategory = await res.json();
        setCategories(prev => [...prev, createdCategory]);
      }
    } catch (error) {
      console.error('Error adding category to backend:', error);
    }
  };

  // Helper actions to control Task Drawer
  const openNewTaskDrawer = (initialStatus = 'todo') => {
    setEditingTask({ status: initialStatus });
    setIsDrawerOpen(true);
  };

  const openEditTaskDrawer = (task) => {
    setEditingTask(task);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingTask(null);
  };

  // Computed and filtered tasks
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // 1. Search Query
      const matchSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category Filter
      const matchCategory = currentCategoryFilter === 'all' || task.category === currentCategoryFilter;

      // 3. Priority Filter
      const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      // 4. Date Filter
      let matchDate = true;
      if (dateFilter !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        const taskDate = task.dueDate;
        
        if (dateFilter === 'today') {
          matchDate = taskDate === today;
        } else if (dateFilter === 'week') {
          const todayDate = new Date();
          todayDate.setHours(0,0,0,0);
          const endOfWeek = new Date(todayDate);
          endOfWeek.setDate(todayDate.getDate() + 7);
          
          const tDate = new Date(taskDate);
          matchDate = tDate >= todayDate && tDate <= endOfWeek;
        } else if (dateFilter === 'overdue') {
          matchDate = taskDate < today && task.status !== 'done';
        }
      }

      return matchSearch && matchCategory && matchPriority && matchDate;
    });
  };

  const filteredTasks = getFilteredTasks();

  return (
    <TaskContext.Provider
      value={{
        tasks,
        categories,
        theme,
        currentView,
        currentCategoryFilter,
        searchQuery,
        priorityFilter,
        dateFilter,
        isDrawerOpen,
        editingTask,
        filteredTasks,
        isLoading,
        
        toggleTheme,
        setCurrentView,
        setCurrentCategoryFilter,
        setSearchQuery,
        setPriorityFilter,
        setDateFilter,
        
        addTask,
        updateTask,
        deleteTask,
        toggleSubtask,
        addCategory,
        
        openNewTaskDrawer,
        openEditTaskDrawer,
        closeDrawer,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
