import { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal, MessageSquare } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { TaskCard } from './TaskCard';
import type { Task } from '../App';

interface TaskBoardProps {
  onTaskClick: (task: Task) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

const mockTasks: Task[] = [
  {
    id: 'PROJ-123',
    title: 'Fix authentication redirect issue',
    description: 'Users are being redirected to the wrong page after login',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Mike Johnson',
    reporter: 'Sarah Chen',
    labels: ['bug', 'auth'],
    createdAt: '2025-11-21',
    comments: [
      { id: '1', author: 'Mike Johnson', content: "I'll take a look at this", timestamp: '10:35 AM', avatar: 'MJ' }
    ],
  },
  {
    id: 'PROJ-124',
    title: 'Dashboard redesign mockups',
    description: 'Create new mockups for the analytics dashboard',
    status: 'review',
    priority: 'medium',
    assignee: 'Alex Kim',
    reporter: 'Alex Kim',
    labels: ['design', 'frontend'],
    createdAt: '2025-11-21',
    comments: [],
  },
  {
    id: 'PROJ-125',
    title: 'Implement dark mode toggle',
    description: 'Add a toggle switch for dark/light mode in settings',
    status: 'todo',
    priority: 'medium',
    reporter: 'Sarah Chen',
    labels: ['feature', 'frontend'],
    createdAt: '2025-11-20',
    comments: [],
  },
  {
    id: 'PROJ-126',
    title: 'API rate limiting',
    description: 'Implement rate limiting on all public API endpoints',
    status: 'todo',
    priority: 'high',
    reporter: 'Mike Johnson',
    labels: ['backend', 'security'],
    createdAt: '2025-11-20',
    comments: [],
  },
  {
    id: 'PROJ-127',
    title: 'User onboarding flow',
    description: 'Design and implement new user onboarding experience',
    status: 'backlog',
    priority: 'low',
    reporter: 'Alex Kim',
    labels: ['feature', 'design'],
    createdAt: '2025-11-19',
    comments: [],
  },
  {
    id: 'PROJ-128',
    title: 'Database query optimization',
    description: 'Optimize slow queries in the analytics module',
    status: 'in-progress',
    priority: 'urgent',
    assignee: 'Sarah Chen',
    reporter: 'Mike Johnson',
    labels: ['backend', 'performance'],
    createdAt: '2025-11-21',
    comments: [],
  },
  {
    id: 'PROJ-129',
    title: 'Update documentation',
    description: 'Update API documentation with new endpoints',
    status: 'done',
    priority: 'low',
    assignee: 'Mike Johnson',
    reporter: 'Sarah Chen',
    labels: ['docs'],
    createdAt: '2025-11-18',
    comments: [],
  },
];

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

export function TaskBoard({ onTaskClick, onToggleChat, isChatOpen }: TaskBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex-1 flex flex-col bg-[#f4f5f7]">
      {/* Board header */}
      <div className="h-16 px-6 flex items-center gap-4 bg-white border-b">
        <h1 className="text-gray-900">Project Board</h1>
        <div className="flex-1 max-w-md relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          Filter
        </Button>
        <Button 
          variant={isChatOpen ? "default" : "outline"}
          className={`gap-2 ${isChatOpen ? 'bg-[#5865f2] hover:bg-[#4752c4]' : ''}`}
          onClick={onToggleChat}
        >
          <MessageSquare size={18} />
          {isChatOpen ? 'Hide Chat' : 'Show Chat'}
        </Button>
        <Button className="gap-2 bg-[#0052cc] hover:bg-[#0747a6]">
          <Plus size={18} />
          Create Task
        </Button>
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="h-full flex gap-4 p-6">
          {columns.map((column) => {
            const columnTasks = mockTasks.filter((task) => task.status === column.id);
            
            return (
              <div key={column.id} className="flex-shrink-0 w-[280px] flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="text-gray-700">{column.title}</h3>
                  <span className="text-gray-500 text-sm">({columnTasks.length})</span>
                  <Button variant="ghost" size="sm" className="ml-auto p-1 h-auto">
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start mb-2 text-gray-600 hover:bg-gray-100"
                >
                  <Plus size={18} className="mr-2" />
                  Add a card
                </Button>
                
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pb-2">
                    {columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}