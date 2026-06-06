import React, { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const TaskContext = createContext();

// Initial categories seed data
const initialCategories = [
  { id: 'vr', name: 'Virtual Reality (VR)', color: 'work', icon: 'Glasses' },
  { id: 'ar', name: 'Augmented Reality (AR)', color: 'personal', icon: 'Smartphone' },
  { id: 'mr', name: 'Mixed Reality (MR)', color: 'fitness', icon: 'Layers' },
  { id: 'xr', name: 'Extended Reality (XR)', color: 'shopping', icon: 'Cpu' },
  { id: 'ai', name: 'Artificial Intelligence (AI)', color: 'other', icon: 'Brain' },
];

// Initial tasks seed data
const getInitialTasks = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 5);
  const nextWeek = nextWeekDate.toISOString().split('T')[0];

  return [
    {
      id: 'task-1',
      title: 'Tích hợp nhận diện cử chỉ tay (Gesture Tracking) bằng MediaPipe',
      description: 'Thiết lập luồng xử lý dữ liệu camera trực tiếp, tải mô hình nhận dạng tay của MediaPipe và ánh xạ các cử chỉ tay (pinch, grab, point) thành các sự kiện điều khiển trong không gian ảo.',
      status: 'inprogress',
      priority: 'high',
      category: 'ai',
      dueDate: today,
      subtasks: [
        { id: 'sub-1-1', text: 'Thiết lập luồng đầu vào Camera trực tiếp', completed: true },
        { id: 'sub-1-2', text: 'Tải mô hình nhận dạng bàn tay MediaPipe', completed: true },
        { id: 'sub-1-3', text: 'Ánh xạ cử chỉ tay thành sự kiện điều khiển', completed: false }
      ],
      createdAt: yesterday
    },
    {
      id: 'task-2',
      title: 'Tối ưu hóa hiệu năng render (Draw Calls) trên Meta Quest 3',
      description: 'Phân tích hiệu năng bằng Oculus Profiler, kích hoạt static batching, bake lightmaps trong Unity và giảm thiểu các vật liệu không cần thiết để đạt tốc độ khung hình ổn định 90 FPS.',
      status: 'done',
      priority: 'high',
      category: 'vr',
      dueDate: yesterday,
      subtasks: [
        { id: 'sub-2-1', text: 'Bật tính năng Static Batching & GPU Instancing', completed: true },
        { id: 'sub-2-2', text: 'Thực hiện nướng bản đồ ánh sáng (Bake Lightmaps)', completed: true },
        { id: 'sub-2-3', text: 'Kiểm tra tốc độ khung hình bằng Oculus Profiler', completed: true }
      ],
      createdAt: yesterday
    },
    {
      id: 'task-3',
      title: 'Phát triển tính năng định vị không gian (Spatial Anchors)',
      description: 'Nghiên cứu API ARKit/ARCore Spatial Anchors, viết dịch vụ lưu trữ tọa độ mỏ neo không gian và thực nghiệm định vị đối tượng ảo tại các vị trí vật lý cố định.',
      status: 'todo',
      priority: 'medium',
      category: 'ar',
      dueDate: tomorrow,
      subtasks: [
        { id: 'sub-3-1', text: 'Nghiên cứu tài liệu API Spatial Anchors của ARKit/ARCore', completed: false },
        { id: 'sub-3-2', text: 'Viết mã dịch vụ lưu trữ tọa độ điểm neo không gian', completed: false },
        { id: 'sub-3-3', text: 'Kiểm thử định vị đối tượng ảo tại vị trí vật lý cố định', completed: false }
      ],
      createdAt: yesterday
    },
    {
      id: 'task-4',
      title: 'Thiết kế tương tác vật lý với đối tượng ảo (Hand Physics)',
      description: 'Cấu hình các thuộc tính collider vật lý, tích hợp các cử chỉ tương tác chạm (poke) và cầm nắm (grab) của Meta Interaction SDK, sửa lỗi clipping hình ảnh khi cầm nắm.',
      status: 'inreview',
      priority: 'high',
      category: 'mr',
      dueDate: today,
      subtasks: [
        { id: 'sub-4-1', text: 'Cấu hình các thuộc tính collider vật lý cho đối tượng ảo', completed: true },
        { id: 'sub-4-2', text: 'Tích hợp cử chỉ chạm và cầm nắm của Interaction SDK', completed: true },
        { id: 'sub-4-3', text: 'Khắc phục lỗi xuyên vân (clipping) khi tương tác cầm nắm', completed: false }
      ],
      createdAt: yesterday
    },
    {
      id: 'task-5',
      title: 'Tinh chỉnh mô hình LLM làm hướng dẫn viên ảo trong phòng VR',
      description: 'Thu thập tập dữ liệu hội thoại hướng dẫn du lịch, tiến hành tinh chỉnh mô hình ngôn ngữ lớn (LLM) cục bộ và tích hợp kết nối WebSockets thời gian thực giữa ứng dụng VR và máy chủ AI.',
      status: 'todo',
      priority: 'medium',
      category: 'ai',
      dueDate: nextWeek,
      subtasks: [
        { id: 'sub-6-1', text: 'Thu thập tập dữ liệu hội thoại hướng dẫn viên', completed: false },
        { id: 'sub-6-2', text: 'Tinh chỉnh mô hình ngôn ngữ lớn (LLM) cục bộ', completed: false },
        { id: 'sub-6-3', text: 'Tích hợp kết nối WebSockets thời gian thực', completed: false }
      ],
      createdAt: today
    },
    {
      id: 'task-6',
      title: 'Tích hợp OpenXR SDK cho dự án đa nền tảng',
      description: 'Cài đặt và thiết lập OpenXR Plugin, cấu hình ánh xạ hệ thống nút bấm của các loại tay cầm điều khiển (Quest, Index, Cosmos) và kiểm thử bản build trên Meta Quest và Apple Vision Pro.',
      status: 'done',
      priority: 'low',
      category: 'xr',
      dueDate: yesterday,
      subtasks: [
        { id: 'sub-5-1', text: 'Cài đặt OpenXR Plugin và cấu hình đầu vào', completed: true },
        { id: 'sub-5-2', text: 'Thiết lập bản build kiểm thử trên Meta Quest và Apple Vision Pro', completed: true }
      ],
      createdAt: yesterday
    }
  ];
};

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useLocalStorage('tasks_data', getInitialTasks());
  const [categories, setCategories] = useLocalStorage('tasks_categories', initialCategories);
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

  // Task CRUD actions
  const addTask = (taskData) => {
    const newTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      subtasks: taskData.subtasks || [],
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const updateTask = (taskId, updatedFields) => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === taskId ? { ...task, ...updatedFields } : task))
    );
  };

  const deleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (editingTask && editingTask.id === taskId) {
      closeDrawer();
    }
  };

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

  // Categories CRUD
  const addCategory = (categoryName) => {
    const id = categoryName.toLowerCase().replace(/\s+/g, '-');
    // Prevent duplicates
    if (categories.some(c => c.id === id)) return;
    
    const colors = ['work', 'personal', 'shopping', 'fitness', 'other'];
    const assignedColor = colors[categories.length % colors.length];
    
    const newCategory = {
      id,
      name: categoryName,
      color: assignedColor,
      icon: 'FolderOpen'
    };
    setCategories(prev => [...prev, newCategory]);
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
