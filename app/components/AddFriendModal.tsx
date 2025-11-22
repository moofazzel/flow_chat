import { Mail, Search, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';

interface AddFriendModalProps {
  open: boolean;
  onClose: () => void;
  onAddFriend: (identifier: string) => void;
  existingFriends: string[]; // Array of friend IDs
}

// Mock users database (simulates searching for users)
const MOCK_USERS = [
  { id: 'u1', name: 'Jessica Parker', email: 'jessica@company.com', avatar: 'JP' },
  { id: 'u2', name: 'Robert Chen', email: 'robert@company.com', avatar: 'RC' },
  { id: 'u3', name: 'Maria Garcia', email: 'maria@company.com', avatar: 'MG' },
  { id: 'u4', name: 'James Wilson', email: 'james@company.com', avatar: 'JW' },
  { id: 'u5', name: 'Anna Schmidt', email: 'anna@company.com', avatar: 'AS' },
  { id: 'u6', name: 'Chris Taylor', email: 'chris@company.com', avatar: 'CT' },
  { id: 'u7', name: 'Priya Patel', email: 'priya@company.com', avatar: 'PP' },
  { id: 'u8', name: 'Daniel Kim', email: 'daniel@company.com', avatar: 'DK' },
];

export function AddFriendModal({ open, onClose, onAddFriend, existingFriends }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof MOCK_USERS>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a username or email');
      return;
    }

    setIsSearching(true);

    // Simulate API search
    setTimeout(() => {
      const results = MOCK_USERS.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(results);
      setIsSearching(false);

      if (results.length === 0) {
        toast.error('No users found');
      }
    }, 500);
  };

  const handleAddFriend = (userId: string, userName: string) => {
    if (existingFriends.includes(userId)) {
      toast.error('Already friends with this user');
      return;
    }

    onAddFriend(userId);
    toast.success(`Friend request sent to ${userName}!`);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="text-[#5865f2]" size={24} />
            Add Friend
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Search for friends by username or email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Username or email..."
                className="pl-9 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              {isSearching ? (
                <div className="animate-spin">⏳</div>
              ) : (
                <Search size={16} />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="text-gray-400 text-sm font-medium px-1">
                Found {searchResults.length} user{searchResults.length > 1 ? 's' : ''}
              </div>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1e1f22] hover:bg-[#35363c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#5865f2] text-white">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <Mail size={12} />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddFriend(user.id, user.name)}
                    size="sm"
                    disabled={existingFriends.includes(user.id)}
                    className={`${
                      existingFriends.includes(user.id)
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-[#5865f2] hover:bg-[#4752c4]'
                    } text-white`}
                  >
                    {existingFriends.includes(user.id) ? (
                      'Friends'
                    ) : (
                      <>
                        <UserPlus size={14} className="mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Suggestions */}
          {searchResults.length === 0 && !isSearching && (
            <div className="space-y-2">
              <div className="text-gray-400 text-sm font-medium px-1">
                Suggested Users
              </div>
              {MOCK_USERS.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1e1f22] hover:bg-[#35363c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddFriend(user.id, user.name)}
                    size="sm"
                    disabled={existingFriends.includes(user.id)}
                    className={`${
                      existingFriends.includes(user.id)
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-[#5865f2] hover:bg-[#4752c4]'
                    } text-white`}
                  >
                    {existingFriends.includes(user.id) ? (
                      'Friends'
                    ) : (
                      <>
                        <UserPlus size={14} className="mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg p-3">
            <div className="text-[#5865f2] text-sm">
              💡 <span className="font-medium">Tip:</span> You can search by name or email address
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}