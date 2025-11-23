"use client";

import { register } from "@/utils/auth";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User,
  UserCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (
    pass: string
  ): { strength: number; label: string; color: string } => {
    if (pass.length === 0) return { strength: 0, label: "", color: "" };
    if (pass.length < 6)
      return { strength: 1, label: "Weak", color: "bg-red-500" };
    if (pass.length < 10)
      return { strength: 2, label: "Medium", color: "bg-yellow-500" };
    return { strength: 3, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      toast.error("Invalid email", {
        description: "Please enter a valid email address",
        duration: 4000,
      });
      return;
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      toast.error("Invalid username", {
        description:
          "Username can only contain letters, numbers, and underscores",
        duration: 4000,
      });
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      toast.error("Username too short", {
        description: "Username must be at least 3 characters",
        duration: 4000,
      });
      return;
    }

    if (username.length > 20) {
      setError("Username must be less than 20 characters");
      toast.error("Username too long", {
        description: "Username must be less than 20 characters",
        duration: 4000,
      });
      return;
    }

    // Password validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Password mismatch", {
        description: "Please make sure both passwords match",
        duration: 4000,
      });
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Password too weak", {
        description: "Password must be at least 6 characters long",
        duration: 4000,
      });
      return;
    }

    if (password.length > 72) {
      setError("Password must be less than 72 characters");
      toast.error("Password too long", {
        description: "Password must be less than 72 characters",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(email, password, username, fullName);
      console.log("🚀 ~ result:", result);

      setIsLoading(false);

      if (result.success && result.user) {
        // Clear form
        setEmail("");
        setUsername("");
        setFullName("");
        setPassword("");
        setConfirmPassword("");
        setError("");

        // Show success toast
        toast.success("Account created successfully!", {
          description: `Welcome to Flow Chat, ${result.user.full_name}! Please login to continue.`,
          duration: 4000,
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          onSwitchToLogin();
        }, 1500);
      } else {
        // Handle specific error cases
        const errorMessage =
          result.error || "Registration failed. Please try again.";
        let userFriendlyMessage = errorMessage;
        let toastTitle = "Registration failed";

        // Check for specific error patterns
        if (
          errorMessage.toLowerCase().includes("already registered") ||
          errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("user already registered")
        ) {
          userFriendlyMessage =
            "An account with this email already exists. Please login instead.";
          toastTitle = "Account already exists";

          // Show special toast with action to switch to login
          setError(userFriendlyMessage);
          toast.error(toastTitle, {
            description: userFriendlyMessage,
            duration: 6000,
            action: {
              label: "Go to Login",
              onClick: () => onSwitchToLogin(),
            },
          });
          return; // Exit early since we've already shown the toast
        } else if (errorMessage.toLowerCase().includes("email")) {
          if (errorMessage.toLowerCase().includes("invalid")) {
            userFriendlyMessage = "Please enter a valid email address";
            toastTitle = "Invalid email";
          } else if (errorMessage.toLowerCase().includes("rate limit")) {
            userFriendlyMessage =
              "Too many registration attempts. Please try again in a few minutes.";
            toastTitle = "Rate limit exceeded";
          }
        } else if (errorMessage.toLowerCase().includes("password")) {
          if (
            errorMessage.toLowerCase().includes("weak") ||
            errorMessage.toLowerCase().includes("strength")
          ) {
            userFriendlyMessage =
              "Password is too weak. Please use a stronger password.";
            toastTitle = "Weak password";
          } else if (errorMessage.toLowerCase().includes("short")) {
            userFriendlyMessage = "Password must be at least 6 characters long";
            toastTitle = "Password too short";
          }
        } else if (errorMessage.toLowerCase().includes("username")) {
          userFriendlyMessage =
            "This username is already taken. Please choose another one.";
          toastTitle = "Username unavailable";
        } else if (
          errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("fetch")
        ) {
          userFriendlyMessage =
            "Network error. Please check your connection and try again.";
          toastTitle = "Connection error";
        } else if (errorMessage.toLowerCase().includes("timeout")) {
          userFriendlyMessage = "Request timed out. Please try again.";
          toastTitle = "Request timeout";
        } else if (errorMessage.toLowerCase().includes("rate limit")) {
          userFriendlyMessage =
            "Too many attempts. Please wait a moment and try again.";
          toastTitle = "Too many attempts";
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
      let toastTitle = "Registration failed";

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
              ✨
            </div>
          </motion.div>
          <h1 className="text-white text-2xl mb-2">Create an account</h1>
          <p className="text-[#b5bac1] text-sm">
            Join Flow Chat and start collaborating!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[#b5bac1] text-xs uppercase tracking-wide"
            >
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
            <Label
              htmlFor="fullName"
              className="text-[#b5bac1] text-xs uppercase tracking-wide"
            >
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
            <Label
              htmlFor="username"
              className="text-[#b5bac1] text-xs uppercase tracking-wide"
            >
              Username <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5bac1]" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                className="bg-[#1e1f22] border-0 text-white pl-10 h-11 focus:ring-2 focus:ring-[#5865f2]"
                placeholder="johndoe"
                required
                disabled={isLoading}
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
            </div>
            <p className="text-xs text-[#b5bac1]">
              Letters, numbers, and underscores only
            </p>
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

            {/* Password Strength Indicator */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1"
              >
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.strength
                          ? passwordStrength.color
                          : "bg-[#1e1f22]"
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.label && (
                  <p className="text-xs text-[#b5bac1]">
                    Password strength:{" "}
                    <span
                      className={
                        passwordStrength.strength === 3
                          ? "text-green-500"
                          : passwordStrength.strength === 2
                          ? "text-yellow-500"
                          : "text-red-500"
                      }
                    >
                      {passwordStrength.label}
                    </span>
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-[#b5bac1] text-xs uppercase tracking-wide"
            >
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
              animate={{ opacity: 1, height: "auto" }}
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
              "Continue"
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
          By registering, you agree to our{" "}
          <button className="text-[#00a8fc] hover:underline">
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="text-[#00a8fc] hover:underline">
            Privacy Policy
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
