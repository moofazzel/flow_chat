'use client';

import { register } from '@/utils/auth';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, User, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (pass: string): { strength: number; label: string; color: string } => {
    if (pass.length === 0) return { strength: 0, label: '', color: '' };
    if (pass.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (pass.length < 10) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = register(email, username, password, fullName);

    setIsLoading(false);

    if (result.success && result.user) {
      toast.success('Account created!', {
        description: `Welcome to Chatapp, ${result.user.fullName}!`,
      });
      // Auto-login after registration
      onSuccess();
    } else {
      setError(result.error || 'Registration failed');
      toast.error('Registration failed', {
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
              ✨
            </div>
          </motion.div>
          <h1 className="text-white text-2xl mb-2">Create an account</h1>
          <p className="text-[#b5bac1] text-sm">
            Join Chatapp and start collaborating!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#b5bac1] text-xs uppercase tracking-wide">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[#b5bac1] text-xs uppercase tracking-wide">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[#b5bac1] text-xs uppercase tracking-wide">
              Username <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="johndoe"
                required
                disabled={isLoading}
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
            </div>
            <p className="text-xs text-[#b5bac1]">Letters, numbers, and underscores only</p>
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
            
            {/* Password Strength Indicator */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1"
              >
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.strength
                          ? passwordStrength.color
                          : 'bg-[#1e1f22]'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.label && (
                  <p className="text-xs text-[#b5bac1]">
                    Password strength: <span className={passwordStrength.strength === 3 ? 'text-green-500' : passwordStrength.strength === 2 ? 'text-yellow-500' : 'text-red-500'}>{passwordStrength.label}</span>
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#b5bac1] text-xs uppercase tracking-wide">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              {password && confirmPassword && password === confirmPassword && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="Confirm your password"
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white h-11 transition-colors mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          {/* Login Link */}
          <div className="text-sm text-[#b5bac1] mt-2">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#00a8fc] hover:underline"
            >
              Already have an account?
            </button>
          </div>
        </form>
      </div>

      {/* Terms */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center"
      >
        <p className="text-[#b5bac1] text-xs">
          By registering, you agree to our{' '}
          <button className="text-[#00a8fc] hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-[#00a8fc] hover:underline">Privacy Policy</button>
        </p>
      </motion.div>
    </motion.div>
  );
}
