"use client";

import { login } from "@/utils/auth";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!emailOrUsername.trim()) {
      setError("Email or username is required");
      toast.error("Missing credentials", {
        description: "Please enter your email or username",
        duration: 4000,
      });
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      toast.error("Missing password", {
        description: "Please enter your password",
        duration: 4000,
      });
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Invalid password", {
        description: "Password must be at least 6 characters",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Login with email (Supabase only accepts email for login)
      const result = await login(emailOrUsername, password);

      setIsLoading(false);

      if (result.success && result.user) {
        // Clear form
        setEmailOrUsername("");
        setPassword("");
        setError("");

        // Show success toast
        toast.success("Welcome back!", {
          description: `Logged in as ${result.user.full_name}`,
          duration: 3000,
        });

        // Call success callback
        onSuccess();
      } else {
        // Handle specific error cases
        const errorMessage = result.error || "Login failed. Please try again.";
        let userFriendlyMessage = errorMessage;
        let toastTitle = "Login failed";

        // Check for specific error patterns
        if (
          errorMessage.toLowerCase().includes("invalid login credentials") ||
          errorMessage.toLowerCase().includes("invalid email or password") ||
          errorMessage.toLowerCase().includes("incorrect password")
        ) {
          userFriendlyMessage =
            "Invalid email or password. Please check your credentials and try again.";
          toastTitle = "Invalid credentials";
        }
        // TODO: Add email verification check back when implementing email verification
        else if (
          errorMessage.toLowerCase().includes("user not found") ||
          errorMessage.toLowerCase().includes("no user found")
        ) {
          userFriendlyMessage =
            "No account found with this email. Would you like to register?";
          toastTitle = "Account not found";

          // Show special toast with action to switch to register
          setError(userFriendlyMessage);
          toast.error(toastTitle, {
            description: userFriendlyMessage,
            duration: 6000,
            action: {
              label: "Create Account",
              onClick: () => onSwitchToRegister(),
            },
          });
          return; // Exit early since we've already shown the toast
        } else if (
          errorMessage.toLowerCase().includes("too many requests") ||
          errorMessage.toLowerCase().includes("rate limit")
        ) {
          userFriendlyMessage =
            "Too many login attempts. Please wait a few minutes and try again.";
          toastTitle = "Too many attempts";
        } else if (
          errorMessage.toLowerCase().includes("account locked") ||
          errorMessage.toLowerCase().includes("account disabled")
        ) {
          userFriendlyMessage =
            "Your account has been locked. Please contact support for assistance.";
          toastTitle = "Account locked";
        } else if (
          errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("fetch")
        ) {
          userFriendlyMessage =
            "Network error. Please check your internet connection and try again.";
          toastTitle = "Connection error";
        } else if (errorMessage.toLowerCase().includes("timeout")) {
          userFriendlyMessage = "Request timed out. Please try again.";
          toastTitle = "Request timeout";
        } else if (errorMessage.toLowerCase().includes("server error")) {
          userFriendlyMessage =
            "Server error. Please try again later or contact support.";
          toastTitle = "Server error";
        }

        setError(userFriendlyMessage);
        toast.error(toastTitle, {
          description: userFriendlyMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      setIsLoading(false);

      // Handle unexpected errors
      let errorMessage = "An unexpected error occurred. Please try again.";
      let toastTitle = "Login failed";

      if (error instanceof Error) {
        // Network errors
        if (
          error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your internet connection.";
          toastTitle = "Connection error";
        }
        // Timeout errors
        else if (error.message.toLowerCase().includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
          toastTitle = "Request timeout";
        }
        // CORS or security errors
        else if (
          error.message.toLowerCase().includes("cors") ||
          error.message.toLowerCase().includes("blocked")
        ) {
          errorMessage = "Security error. Please contact support.";
          toastTitle = "Security error";
        }
        // Use the actual error message if it's informative
        else if (error.message && error.message.length < 100) {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      toast.error(toastTitle, {
        description: errorMessage,
        duration: 5000,
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
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center text-white text-2xl mx-auto">
              💬
            </div>
          </motion.div>
          <h1 className="text-white text-2xl mb-2">Welcome back!</h1>
          <p className="text-[#b5bac1] text-sm">
            We&apos;re so excited to see you again!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username Field */}
          <div className="space-y-2">
            <Label
              htmlFor="emailOrUsername"
              className="text-[#b5bac1] text-xs uppercase tracking-wide"
            >
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="emailOrUsername"
                type="email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[#b5bac1] text-xs uppercase tracking-wide"
            >
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
              animate={{ opacity: 1, height: "auto" }}
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
              onClick={() => toast.info("Password reset coming soon!")}
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
              "Log In"
            )}
          </Button>

          {/* Register Link */}
          <div className="text-sm text-[#b5bac1] mt-2">
            Need an account?{" "}
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
          💡 <span className="text-[#5865f2]">Tip:</span> Register a new account
          to get started!
        </p>
      </motion.div>
    </motion.div>
  );
}
