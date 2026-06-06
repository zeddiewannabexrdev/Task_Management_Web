import React from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import TaskDrawer from './components/TaskDrawer';

function AppContent() {
  const { currentView } = useTasks();

  return (
    <div className="app-container">
      {/* Sidebar navigation and options */}
      <Sidebar />
      
      {/* Main panel */}
      <main className="main-content">
        {/* Top search and user profile bar */}
        <Header />
        
        {/* Dynamic content rendering based on active view */}
        <div className="content-body">
          {currentView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <TaskBoard />
          )}
        </div>
      </main>

      {/* Task Creation / Edit Drawer Modal */}
      <TaskDrawer />
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}
