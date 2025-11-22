import { useState } from 'react';
import { Mic, MicOff, Headphones, VolumeX, Settings, Volume2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';

interface AudioControlsPopoverProps {
  type: 'mic' | 'headphones';
  isMuted?: boolean;
  onToggle?: () => void;
}

export function AudioControlsPopover({ type, isMuted = false, onToggle }: AudioControlsPopoverProps) {
  const [volume, setVolume] = useState([80]);
  const [inputVolume, setInputVolume] = useState([75]);
  const [selectedDevice, setSelectedDevice] = useState('default');
  
  const isMicControl = type === 'mic';
  const Icon = isMicControl ? (isMuted ? MicOff : Mic) : (isMuted ? VolumeX : Headphones);
  const title = isMicControl ? 'Microphone Settings' : 'Audio Output Settings';

  const devices = isMicControl 
    ? ['Default - MacBook Pro Microphone', 'AirPods Pro', 'External USB Microphone', 'Logitech Webcam']
    : ['Default - MacBook Pro Speakers', 'AirPods Pro', 'External Speakers', 'HDMI Audio'];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#35363c]"
          title={isMicControl ? 'Voice Settings' : 'Audio Settings'}
        >
          <Icon size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[340px] bg-[#2b2d31] border-[#1e1f22] text-white p-0" 
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title="Advanced Settings"
            >
              <Settings size={16} />
            </Button>
          </div>

          {/* Device Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              {isMicControl ? 'Input Device' : 'Output Device'}
            </label>
            <select 
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-[#1e1f22] border-none rounded p-2 text-white text-sm focus:ring-2 focus:ring-[#5865f2] outline-none"
            >
              {devices.map((device, idx) => (
                <option key={idx} value={device}>{device}</option>
              ))}
            </select>
          </div>

          <Separator className="bg-[#1e1f22] my-4" />

          {/* Volume Control */}
          {isMicControl ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Input Volume
                  </label>
                  <span className="text-sm text-white">{inputVolume[0]}%</span>
                </div>
                <Slider
                  value={inputVolume}
                  onValueChange={setInputVolume}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Mic Test */}
              <div className="bg-[#1e1f22] rounded p-3">
                <div className="text-sm text-white mb-2">Mic Test</div>
                <div className="h-2 bg-[#313338] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#3ba55d] transition-all duration-100"
                    style={{ width: `${Math.random() * 70 + 20}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">Speak to test your microphone</div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className={`w-full justify-start gap-2 ${
                    isMuted ? 'text-red-400 hover:text-red-300' : 'text-white'
                  }`}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  {isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Output Volume
                  </label>
                  <span className="text-sm text-white">{volume[0]}%</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Audio Test */}
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-[#1e1f22] border-none hover:bg-[#313338] text-white gap-2"
              >
                <Volume2 size={16} />
                Test Audio
              </Button>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className={`w-full justify-start gap-2 ${
                    isMuted ? 'text-red-400 hover:text-red-300' : 'text-white'
                  }`}
                >
                  {isMuted ? <VolumeX size={16} /> : <Headphones size={16} />}
                  {isMuted ? 'Undeafen' : 'Deafen'}
                </Button>
              </div>
            </div>
          )}

          <Separator className="bg-[#1e1f22] my-4" />

          {/* Footer Info */}
          <div className="text-xs text-gray-400">
            {isMicControl ? (
              <div className="flex items-start gap-2">
                <Mic size={12} className="mt-0.5 flex-shrink-0" />
                <span>Your microphone input is being processed. Use push-to-talk for better control.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Headphones size={12} className="mt-0.5 flex-shrink-0" />
                <span>Adjust output volume or deafen to mute all incoming audio.</span>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}