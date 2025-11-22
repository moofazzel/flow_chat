import { Check, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface AddToGroupModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: {
    userId: string;
    userName: string;
  };
}

interface Group {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  isAdmin: boolean;
}

// Mock groups
const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Project Team', avatar: 'PT', memberCount: 8, isAdmin: true },
  { id: 'g2', name: 'Design Squad', avatar: 'DS', memberCount: 5, isAdmin: true },
  { id: 'g3', name: 'Dev Chat', avatar: 'DC', memberCount: 12, isAdmin: false },
  { id: 'g4', name: 'Marketing Team', avatar: 'MT', memberCount: 6, isAdmin: true },
  { id: 'g5', name: 'Product Discussion', avatar: 'PD', memberCount: 10, isAdmin: false },
];

export function AddToGroupModal({ open, onClose, currentUser }: AddToGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const filteredGroups = MOCK_GROUPS.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleAddToGroups = () => {
    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    const groupNames = MOCK_GROUPS.filter(g => selectedGroups.includes(g.id))
      .map(g => g.name)
      .join(', ');

    toast.success(`${currentUser.userName} added to: ${groupNames}`);
    setSelectedGroups([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#313338] border-[#1e1f22] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users size={20} className="text-[#5865f2]" />
            Add {currentUser.userName} to Groups
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Select groups to add this user to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search */}
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
          />

          {/* Groups List */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredGroups.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No groups found
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#2b2d31] hover:bg-[#383a40] transition-colors cursor-pointer"
                    onClick={() => handleToggleGroup(group.id)}
                  >
                    <Checkbox
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => handleToggleGroup(group.id)}
                      className="border-gray-500"
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#5865f2] text-white">
                        {group.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-white font-medium">{group.name}</div>
                      <div className="text-gray-400 text-xs">
                        {group.memberCount} members{group.isAdmin && ' • Admin'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Selected Count */}
          {selectedGroups.length > 0 && (
            <div className="bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg p-3">
              <div className="text-sm text-[#5865f2]">
                {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex-1 bg-[#2b2d31] hover:bg-[#383a40] text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToGroups}
              disabled={selectedGroups.length === 0}
              className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <Check size={16} className="mr-2" />
              Add to Groups
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}