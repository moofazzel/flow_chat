import { useState } from 'react';
import { Hash, Volume2, Lock, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (channelData: { name: string; type: 'text' | 'voice'; isPrivate: boolean }) => void;
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = () => {
    if (channelName.trim()) {
      onCreate({
        name: channelName.toLowerCase().replace(/\s+/g, '-'),
        type: channelType,
        isPrivate: isPrivate,
      });
      // Reset form
      setChannelName('');
      setChannelType('text');
      setIsPrivate(false);
      onClose();
    }
  };

  const handleClose = () => {
    setChannelName('');
    setChannelType('text');
    setIsPrivate(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31]">
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="text-[#5865f2]" size={24} />
            Create Channel
          </DialogTitle>
          <DialogDescription className="text-[#b5bac1] text-[15px] mt-2">
            Channels are where your team communicates. They're best organized around a topic — #marketing, for example.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Channel Type */}
          <div className="space-y-3">
            <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
              Channel Type
            </Label>
            <RadioGroup value={channelType} onValueChange={(value) => setChannelType(value as 'text' | 'voice')}>
              <div 
                className={`flex items-start space-x-3 p-4 rounded-lg transition-all cursor-pointer border-2 ${
                  channelType === 'text' 
                    ? 'bg-[#404249] border-[#5865f2] shadow-lg' 
                    : 'bg-[#2b2d31] border-transparent hover:border-[#404249]'
                }`}
                onClick={() => setChannelType('text')}
              >
                <RadioGroupItem value="text" id="text" className="mt-0.5 border-[#b5bac1]" />
                <label htmlFor="text" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-md ${channelType === 'text' ? 'bg-[#5865f2]' : 'bg-[#404249]'}`}>
                      <Hash size={18} className="text-white" />
                    </div>
                    <span className="text-white font-semibold">Text</span>
                  </div>
                  <p className="text-[13px] text-[#b5bac1] leading-relaxed">
                    Send messages, images, GIFs, emoji, opinions, and puns
                  </p>
                </label>
              </div>

              <div 
                className={`flex items-start space-x-3 p-4 rounded-lg transition-all cursor-pointer border-2 ${
                  channelType === 'voice' 
                    ? 'bg-[#404249] border-[#5865f2] shadow-lg' 
                    : 'bg-[#2b2d31] border-transparent hover:border-[#404249]'
                }`}
                onClick={() => setChannelType('voice')}
              >
                <RadioGroupItem value="voice" id="voice" className="mt-0.5 border-[#b5bac1]" />
                <label htmlFor="voice" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-md ${channelType === 'voice' ? 'bg-[#5865f2]' : 'bg-[#404249]'}`}>
                      <Volume2 size={18} className="text-white" />
                    </div>
                    <span className="text-white font-semibold">Voice</span>
                  </div>
                  <p className="text-[13px] text-[#b5bac1] leading-relaxed">
                    Hang out together with voice, video, and screen share
                  </p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="channel-name" className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
              Channel Name
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80848e]">
                {channelType === 'text' ? <Hash size={18} /> : <Volume2 size={18} />}
              </div>
              <Input
                id="channel-name"
                placeholder={channelType === 'text' ? 'new-channel' : 'General'}
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="bg-[#1e1f22] border-none text-white pl-10 h-11 focus-visible:ring-1 focus-visible:ring-[#5865f2] placeholder:text-[#6d6f78]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
            {channelName && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 bg-[#2b2d31] rounded-md border border-[#1e1f22]">
                <span className="text-[#80848e]">Preview:</span>
                <span className="text-[#b5bac1] font-medium">
                  {channelType === 'text' ? '#' : '🔊'} {channelName.toLowerCase().replace(/\s+/g, '-')}
                </span>
              </div>
            )}
          </div>

          {/* Private Channel */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-[#2b2d31] border border-[#1e1f22] hover:border-[#404249] transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={18} className="text-[#b5bac1]" />
                <span className="text-white font-semibold">Private Channel</span>
              </div>
              <p className="text-[13px] text-[#b5bac1] leading-relaxed">
                Only selected members and roles will be able to view this channel
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="mt-1 data-[state=checked]:bg-[#5865f2]"
            />
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
            onClick={handleCreate}
            disabled={!channelName.trim()}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#5865f2] shadow-lg"
          >
            Create Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}