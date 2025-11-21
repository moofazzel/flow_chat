import { MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Task } from '../App';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xs text-gray-500">{task.id}</span>
        <Badge
          variant="outline"
          className={`text-xs ml-auto ${
            task.priority === 'urgent'
              ? 'border-red-500 text-red-600 bg-red-50'
              : task.priority === 'high'
              ? 'border-orange-500 text-orange-600 bg-orange-50'
              : task.priority === 'medium'
              ? 'border-yellow-600 text-yellow-700 bg-yellow-50'
              : 'border-gray-400 text-gray-600 bg-gray-50'
          }`}
        >
          {task.priority}
        </Badge>
      </div>

      <h4 className="text-gray-900 mb-2 line-clamp-2">{task.title}</h4>

      <div className="flex flex-wrap gap-1 mb-3">
        {task.labels.map((label) => (
          <Badge key={label} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
            {label}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-[#0052cc] text-white">
                {getInitials(task.assignee)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        {task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <MessageSquare size={14} />
            {task.comments.length}
          </div>
        )}
      </div>
    </div>
  );
}
