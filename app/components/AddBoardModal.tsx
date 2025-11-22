import { useState } from 'react';
import { Plus, X, Palette, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface AddBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (boardData: {
    name: string;
    description: string;
    color: string;
  }) => void;
}

const BOARD_COLORS = [
  { name: 'Blue', value: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Purple', value: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Pink', value: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Red', value: 'bg-red-500', hex: '#ef4444' },
  { name: 'Orange', value: 'bg-orange-500', hex: '#f97316' },
  { name: 'Yellow', value: 'bg-yellow-500', hex: '#eab308' },
  { name: 'Green', value: 'bg-green-500', hex: '#22c55e' },
  { name: 'Teal', value: 'bg-teal-500', hex: '#14b8a6' },
  { name: 'Cyan', value: 'bg-cyan-500', hex: '#06b6d4' },
  { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Violet', value: 'bg-violet-500', hex: '#8b5cf6' },
  { name: 'Fuchsia', value: 'bg-fuchsia-500', hex: '#d946ef' },
];

const BOARD_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'Start from scratch',
    icon: '📋',
    columns: [
      { title: 'To Do', color: 'bg-gray-300' },
      { title: 'In Progress', color: 'bg-yellow-300' },
      { title: 'Done', color: 'bg-green-300' },
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Classic workflow',
    icon: '📊',
    columns: [
      { title: 'Backlog', color: 'bg-gray-300' },
      { title: 'To Do', color: 'bg-blue-300' },
      { title: 'In Progress', color: 'bg-yellow-300' },
      { title: 'Review', color: 'bg-purple-300' },
      { title: 'Done', color: 'bg-green-300' },
    ],
  },
  {
    id: 'sprint',
    name: 'Sprint Board',
    description: 'Agile development',
    icon: '🚀',
    columns: [
      { title: 'Sprint Backlog', color: 'bg-gray-300' },
      { title: 'In Development', color: 'bg-blue-300' },
      { title: 'Testing', color: 'bg-yellow-300' },
      { title: 'Ready for Release', color: 'bg-green-300' },
    ],
  },
  {
    id: 'bugs',
    name: 'Bug Tracker',
    description: 'Track issues',
    icon: '🐛',
    columns: [
      { title: 'Reported', color: 'bg-red-300' },
      { title: 'Investigating', color: 'bg-yellow-300' },
      { title: 'In Progress', color: 'bg-blue-300' },
      { title: 'Fixed', color: 'bg-green-300' },
    ],
  },
];

export function AddBoardModal({ isOpen, onClose, onCreateBoard }: AddBoardModalProps) {
  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState(BOARD_TEMPLATES[0]);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0].value);

  const handleClose = () => {
    setStep('template');
    setSelectedTemplate(BOARD_TEMPLATES[0]);
    setBoardName('');
    setBoardDescription('');
    setSelectedColor(BOARD_COLORS[0].value);
    onClose();
  };

  const handleTemplateSelect = (template: typeof BOARD_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setStep('customize');
  };

  const handleCreate = () => {
    if (!boardName.trim()) {
      alert('Please enter a board name');
      return;
    }

    onCreateBoard({
      name: boardName.trim(),
      description: boardDescription.trim(),
      color: selectedColor,
    });

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
        {step === 'template' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <LayoutGrid className="text-[#0052cc]" size={28} />
                Choose a Board Template
              </DialogTitle>
              <DialogDescription>
                Select a template to get started quickly, or start with a blank board.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {BOARD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="flex flex-col items-start p-5 border-2 border-gray-200 rounded-xl hover:border-[#0052cc] hover:shadow-lg transition-all text-left group bg-white"
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-[#0052cc] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {template.columns.map((col, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-gray-100 rounded-md font-medium"
                      >
                        {col.title}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Plus className="text-[#0052cc]" size={28} />
                Customize Your Board
              </DialogTitle>
              <DialogDescription>
                Give your board a name, description, and color.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Board Name */}
              <div className="space-y-2">
                <Label htmlFor="board-name" className="font-medium">
                  Board Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="board-name"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g., Q1 Sprint Planning"
                  className="text-base"
                  autoFocus
                />
              </div>

              {/* Board Description */}
              <div className="space-y-2">
                <Label htmlFor="board-description" className="font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="board-description"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  placeholder="What's this board for?"
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Board Color */}
              <div className="space-y-3">
                <Label className="font-medium flex items-center gap-2">
                  <Palette size={18} />
                  Board Color
                </Label>
                <div className="grid grid-cols-6 gap-3">
                  {BOARD_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`relative h-12 rounded-lg transition-all ${color.value} ${
                        selectedColor === color.value
                          ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105'
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      title={color.name}
                    >
                      {selectedColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <span className="text-xl">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium mb-2 text-gray-700">
                  Template: {selectedTemplate.name}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedTemplate.columns.map((col, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium"
                    >
                      {col.title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('template')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 bg-[#0052cc] hover:bg-[#0747a6] text-white"
                >
                  Create Board
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
