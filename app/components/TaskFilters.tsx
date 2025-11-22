import { useState } from 'react';
import { Filter, X, Tag, User, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LabelBadge, type Label } from './LabelBadge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Checkbox } from './ui/checkbox';

export interface TaskFilter {
  labels: string[];
  priorities: string[];
  assignees: string[];
  statuses: string[];
  search: string;
}

interface TaskFiltersProps {
  filters: TaskFilter;
  onFiltersChange: (filters: TaskFilter) => void;
  availableLabels: Label[];
  availableAssignees: string[];
  availableStatuses: string[];
}

export function TaskFilters({
  filters,
  onFiltersChange,
  availableLabels,
  availableAssignees,
  availableStatuses,
}: TaskFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = 
    filters.labels.length + 
    filters.priorities.length + 
    filters.assignees.length + 
    filters.statuses.length;

  const priorities = [
    { id: 'urgent', name: 'Urgent', color: 'bg-red-100 text-red-700' },
    { id: 'high', name: 'High', color: 'bg-orange-100 text-orange-700' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'low', name: 'Low', color: 'bg-gray-100 text-gray-700' },
  ];

  const toggleFilter = (type: keyof TaskFilter, value: string) => {
    const currentValues = filters[type] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ ...filters, [type]: newValues });
  };

  const clearFilters = () => {
    onFiltersChange({
      labels: [],
      priorities: [],
      assignees: [],
      statuses: [],
      search: filters.search, // Keep search
    });
  };

  const clearFilterType = (type: keyof TaskFilter) => {
    onFiltersChange({ ...filters, [type]: [] });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Active Filters Display */}
      {filters.labels.length > 0 && (
        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
          <Tag size={14} className="text-blue-600" />
          <span className="text-xs text-blue-700">{filters.labels.length}</span>
          <button
            onClick={() => clearFilterType('labels')}
            className="text-blue-600 hover:text-blue-800"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {filters.priorities.length > 0 && (
        <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
          <AlertCircle size={14} className="text-orange-600" />
          <span className="text-xs text-orange-700">{filters.priorities.length}</span>
          <button
            onClick={() => clearFilterType('priorities')}
            className="text-orange-600 hover:text-orange-800"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {filters.assignees.length > 0 && (
        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
          <User size={14} className="text-green-600" />
          <span className="text-xs text-green-700">{filters.assignees.length}</span>
          <button
            onClick={() => clearFilterType('assignees')}
            className="text-green-600 hover:text-green-800"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Filter Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={`gap-2 border-gray-300 relative ${activeFilterCount > 0 ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            <Filter size={18} />
            Filter
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-blue-500">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Filters</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {/* Labels */}
            <div className="p-4 border-b">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag size={14} />
                Labels
              </h4>
              <div className="space-y-2">
                {availableLabels.map(label => (
                  <label
                    key={label.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.labels.includes(label.id)}
                      onCheckedChange={() => toggleFilter('labels', label.id)}
                    />
                    <LabelBadge label={label} size="sm" />
                  </label>
                ))}
                {availableLabels.length === 0 && (
                  <p className="text-xs text-gray-500">No labels available</p>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="p-4 border-b">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                Priority
              </h4>
              <div className="space-y-2">
                {priorities.map(priority => (
                  <label
                    key={priority.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.priorities.includes(priority.id)}
                      onCheckedChange={() => toggleFilter('priorities', priority.id)}
                    />
                    <Badge className={priority.color}>
                      {priority.name}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignees */}
            <div className="p-4 border-b">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <User size={14} />
                Assignee
              </h4>
              <div className="space-y-2">
                {availableAssignees.map(assignee => (
                  <label
                    key={assignee}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.assignees.includes(assignee)}
                      onCheckedChange={() => toggleFilter('assignees', assignee)}
                    />
                    <span className="text-sm">{assignee}</span>
                  </label>
                ))}
                {availableAssignees.length === 0 && (
                  <p className="text-xs text-gray-500">No assignees available</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar size={14} />
                Status
              </h4>
              <div className="space-y-2">
                {availableStatuses.map(status => (
                  <label
                    key={status}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={() => toggleFilter('statuses', status)}
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
