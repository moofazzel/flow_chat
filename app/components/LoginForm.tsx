'use client';

import { login } from '@/utils/auth';
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = login(emailOrUsername, password);

    setIsLoading(false);

    if (result.success && result.user) {
      toast.success('Welcome back!', {
        description: `Logged in as ${result.user.fullName}`,
      });
      onSuccess();
    } else {
      setError(result.error || 'Login failed');
      toast.error('Login failed', {
        description: result.error,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="bg-[#2b2d31] rounded-lg p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center text-white text-2xl mx-auto">
              💬
            </div>
          </motion.div>
          <h1 className="text-white text-2xl mb-2">Welcome back!</h1>
          <p className="text-[#b5bac1] text-sm">
            We're so excited to see you again!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username Field */}
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername" className="text-[#b5bac1] text-xs uppercase tracking-wide">
              Email or Username <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="Enter your email or username"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#b5bac1] text-xs uppercase tracking-wide">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="Enter your password"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Forgot Password Link */}
          <div className="text-left">
            <button
              type="button"
              className="text-[#00a8fc] text-sm hover:underline"
              onClick={() => toast.info('Password reset coming soon!')}
            >
              Forgot your password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white h-11 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </Button>

          {/* Register Link */}
          <div className="text-sm text-[#b5bac1] mt-2">
            Need an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#00a8fc] hover:underline"
            >
              Register
            </button>
          </div>
        </form>
      </div>

      {/* Demo Credentials */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-4 bg-[#2b2d31]/50 rounded-lg border border-[#5865f2]/20"
      >
        <p className="text-[#b5bac1] text-xs text-center mb-2">
          💡 <span className="text-[#5865f2]">Tip:</span> Register a new account to get started!
        </p>
      </motion.div>
    </motion.div>
  );
}
