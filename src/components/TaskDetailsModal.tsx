import { X, Paperclip, Link2, MoreHorizontal, User, Calendar, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Task } from '../App';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {task.id}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-sm ${
                  task.priority === 'urgent' ? 'border-red-500 text-red-600 bg-red-50' :
                  task.priority === 'high' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                  task.priority === 'medium' ? 'border-yellow-600 text-yellow-700 bg-yellow-50' :
                  'border-gray-400 text-gray-600 bg-gray-50'
                }`}
              >
                {task.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Link2 size={18} />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal size={18} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-gray-900 text-2xl mb-2">{task.title}</h2>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <User size={16} />
                    Assignee
                  </label>
                  <Select defaultValue={task.assignee || 'unassigned'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                      <SelectItem value="Alex Kim">Alex Kim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Status</label>
                  <Select defaultValue={task.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Priority</label>
                  <Select defaultValue={task.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Calendar size={16} />
                    Created
                  </label>
                  <div className="text-sm text-gray-900">{task.createdAt}</div>
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                  <Tag size={16} />
                  Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6">
                    + Add label
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Description</label>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-gray-700 text-sm">{task.description || 'No description provided.'}</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Description
                </Button>
              </div>

              {/* Attachments */}
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                  <Paperclip size={16} />
                  Attachments
                </label>
                <Button variant="outline" size="sm" className="gap-2">
                  <Paperclip size={16} />
                  Add attachment
                </Button>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm text-gray-600 mb-3 block">
                  Activity ({task.comments.length})
                </label>
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea placeholder="Add a comment..." className="mb-2" />
                      <Button size="sm" className="bg-[#0052cc] hover:bg-[#0747a6]">
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
