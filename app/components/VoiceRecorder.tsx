import { Mic, Pause, Play, Send, Square, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Start recording immediately when component mounts
    startRecording();

    return () => {
      // Cleanup
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
      toast.success('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
      toast.success('Voice note sent!');
    }
  };

  const handleDelete = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
    startRecording();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#2b2d31] rounded-lg p-4 shadow-xl border border-[#1e1f22]"
    >
      <div className="flex items-center gap-3">
        {/* Recording/Playback Indicator */}
        <div className="flex-shrink-0">
          {isRecording ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-12 h-12 rounded-full bg-[#ed4245] flex items-center justify-center"
            >
              <Mic size={24} className="text-white" />
            </motion.div>
          ) : audioBlob ? (
            <div className="w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center">
              <Play size={24} className="text-white" />
            </div>
          ) : null}
        </div>

        {/* Waveform/Timer */}
        <div className="flex-1">
          <div className="text-white font-medium mb-1">
            {isRecording ? (
              <span className="flex items-center gap-2">
                {isPaused ? 'Paused' : 'Recording'}
                {!isPaused && (
                  <span className="inline-flex gap-1">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-1 h-4 bg-[#ed4245] rounded"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1 h-6 bg-[#ed4245] rounded"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1 h-5 bg-[#ed4245] rounded"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
                      className="w-1 h-7 bg-[#ed4245] rounded"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.8 }}
                      className="w-1 h-4 bg-[#ed4245] rounded"
                    />
                  </span>
                )}
              </span>
            ) : (
              'Voice Note'
            )}
          </div>
          <div className="text-gray-400 text-sm font-mono">
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              {isPaused ? (
                <Button
                  onClick={resumeRecording}
                  size="sm"
                  className="bg-[#248046] hover:bg-[#1a6334] text-white"
                >
                  <Play size={16} />
                </Button>
              ) : (
                <Button
                  onClick={pauseRecording}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Pause size={16} />
                </Button>
              )}
              <Button
                onClick={stopRecording}
                size="sm"
                className="bg-[#ed4245] hover:bg-[#c13a3d] text-white"
              >
                <Square size={16} />
              </Button>
            </>
          ) : audioBlob ? (
            <>
              <Button
                onClick={handlePlayPause}
                size="sm"
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                onClick={handleDelete}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-[#ed4245]"
              >
                <Trash2 size={16} />
              </Button>
              <Button
                onClick={handleSend}
                size="sm"
                className="bg-[#248046] hover:bg-[#1a6334] text-white"
              >
                <Send size={16} />
              </Button>
            </>
          ) : null}

          <Button
            onClick={onCancel}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </motion.div>
  );
}
