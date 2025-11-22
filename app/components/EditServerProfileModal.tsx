import { Edit, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EditServerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditServerProfileModal({ isOpen, onClose }: EditServerProfileModalProps) {
  const [serverName, setServerName] = useState('Workspace');
  const [serverIcon, setServerIcon] = useState('WS');
  const [serverColor, setServerColor] = useState('#5865f2');

  const availableEmojis = ['🎯', '🚀', '⚡', '💼', '🎨', '🔥', '💡', '🌟', '🎮', '📱', '🏆', '💻', '📊', '🎪', '🌈', '⭐'];

  const handleSave = () => {
    if (serverName.trim()) {
      toast.success('Server profile updated successfully!');
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31]">
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Edit className="text-[#5865f2]" size={24} />
            Edit Server Profile
          </DialogTitle>
          <DialogDescription className="text-[#b5bac1] text-[15px] mt-2">
            Customize how your server appears to you
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Server Icon */}
          <div className="space-y-3">
            <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
              Server Icon
            </Label>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-semibold shadow-lg"
                style={{ backgroundColor: serverColor }}
              >
                {serverIcon}
              </div>
              <div className="flex-1">
                <p className="text-[#b5bac1] text-sm mb-3">
                  Choose an emoji for your server
                </p>
                <div className="flex gap-2 flex-wrap">
                  {availableEmojis.slice(0, 8).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setServerIcon(emoji)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110 ${
                        serverIcon === emoji 
                          ? 'bg-[#5865f2] ring-2 ring-[#5865f2] ring-offset-2 ring-offset-[#313338]' 
                          : 'bg-[#2b2d31] hover:bg-[#404249]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="text-[#5865f2] hover:text-[#4752c4] h-auto p-0 text-sm mt-2"
                  onClick={() => {
                    const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
                    setServerIcon(randomEmoji);
                  }}
                >
                  Random emoji
                </Button>
              </div>
            </div>
          </div>

          {/* Server Name */}
          <div className="space-y-2">
            <Label htmlFor="server-name" className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
              Server Nickname
            </Label>
            <Input
              id="server-name"
              placeholder="Workspace"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="bg-[#1e1f22] border-none text-white h-11 placeholder:text-[#6d6f78]"
              autoFocus
              maxLength={32}
            />
            <p className="text-xs text-[#80848e]">
              This is how the server will appear to you. Others will see the original name.
            </p>
          </div>

          {/* Server Color */}
          <div className="space-y-2">
            <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
              Server Color
            </Label>
            <div className="flex gap-3">
              <Input
                type="color"
                value={serverColor}
                onChange={(e) => setServerColor(e.target.value)}
                className="w-20 h-11 bg-[#1e1f22] border-none cursor-pointer"
              />
              <Input
                value={serverColor}
                onChange={(e) => setServerColor(e.target.value)}
                className="bg-[#1e1f22] border-none text-white h-11 flex-1"
                placeholder="#5865f2"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {['#5865f2', '#3ba55d', '#f0b232', '#ed4245', '#9b59b6', '#e91e63'].map((color) => (
                <button
                  key={color}
                  onClick={() => setServerColor(color)}
                  className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                    serverColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#313338]' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
            <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold mb-3 block">
              Preview
            </Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold"
                style={{ backgroundColor: serverColor }}
              >
                {serverIcon}
              </div>
              <div>
                <div className="text-white font-semibold">{serverName || 'Workspace'}</div>
                <div className="text-[#b5bac1] text-sm">Your personalized server</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-[#2b2d31] border-t border-[#1e1f22] gap-3">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="text-white hover:text-white hover:bg-[#4e5058] h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!serverName.trim()}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
