import { Info, Database, HardDrive, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function StorageBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-3">
        <Info size={20} className="flex-shrink-0" />
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <HardDrive size={16} />
            <span>
              <strong>Tasks & Boards:</strong> Full persistence (localStorage)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={16} className="opacity-70" />
            <span className="opacity-90">
              <strong>Chat:</strong> Last 50 messages cached • Full history coming with database
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(false)}
        className="text-white hover:bg-white/20"
      >
        <X size={16} />
      </Button>
    </div>
  );
}