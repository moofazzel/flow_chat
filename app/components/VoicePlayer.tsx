import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { motion } from 'motion/react';

interface VoicePlayerProps {
  audioUrl: string;
  duration: number;
  isOwn?: boolean;
}

export function VoicePlayer({ audioUrl, duration, isOwn = false }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isOwn ? 'bg-[#5865f2]' : 'bg-[#2b2d31]'
      } min-w-[280px] max-w-[320px]`}
    >
      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayPause}
        size="sm"
        className={`flex-shrink-0 w-10 h-10 rounded-full p-0 ${
          isOwn 
            ? 'bg-white/20 hover:bg-white/30 text-white' 
            : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
        }`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </Button>

      {/* Waveform/Progress */}
      <div className="flex-1 space-y-1">
        {/* Visual waveform */}
        <div className="flex items-center gap-0.5 h-8">
          {isPlaying ? (
            // Animated waveform when playing
            Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: ['20%', '100%', '20%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
                className={`flex-1 rounded-full ${
                  isOwn ? 'bg-white/40' : 'bg-[#5865f2]/40'
                }`}
                style={{ minWidth: '2px' }}
              />
            ))
          ) : (
            // Static waveform when paused
            Array.from({ length: 20 }).map((_, i) => {
              const heights = [40, 60, 80, 70, 90, 50, 75, 85, 65, 95, 70, 80, 60, 75, 85, 70, 90, 65, 80, 70];
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full ${
                    isOwn ? 'bg-white/30' : 'bg-[#5865f2]/30'
                  }`}
                  style={{
                    minWidth: '2px',
                    height: `${heights[i]}%`,
                  }}
                />
              );
            })
          )}
        </div>

        {/* Time Progress */}
        <div className="flex items-center justify-between text-xs">
          <span className={isOwn ? 'text-white/80' : 'text-gray-400'}>
            {formatTime(currentTime)}
          </span>
          <span className={isOwn ? 'text-white/80' : 'text-gray-400'}>
            {formatTime(audioDuration)}
          </span>
        </div>
      </div>

      {/* Volume Icon */}
      <div className="flex-shrink-0">
        <Volume2 
          size={18} 
          className={isOwn ? 'text-white/60' : 'text-gray-400'}
        />
      </div>
    </div>
  );
}
