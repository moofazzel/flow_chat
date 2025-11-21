import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { FloatingChat } from './components/FloatingChat';

export type ViewType = 'chat' | 'board';

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  reporter: string;
  labels: string[];
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#313338]">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedChannel={selectedChannel}
        onChannelSelect={setSelectedChannel}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'chat' ? (
          <ChatArea channelId={selectedChannel} onTaskClick={setSelectedTask} />
        ) : (
          <TaskBoard 
            onTaskClick={setSelectedTask}
            onToggleChat={() => setFloatingChatOpen(!floatingChatOpen)}
            isChatOpen={floatingChatOpen}
          />
        )}
      </div>

      {currentView === 'board' && floatingChatOpen && (
        <FloatingChat 
          channelId={selectedChannel}
          onTaskClick={setSelectedTask}
          onClose={() => setFloatingChatOpen(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}