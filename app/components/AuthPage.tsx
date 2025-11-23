"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#5865f2]/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#5865f2]/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-center gap-12">
        {/* Left Side - Branding (hidden on mobile) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col items-start flex-1 max-w-md"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-[#5865f2] rounded-2xl flex items-center justify-center text-white text-5xl shadow-2xl">
              💬
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white text-5xl mb-4"
          >
            Welcome to <br />
            <span className="text-[#5865f2]">Flow Chat</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[#b5bac1] text-lg mb-8"
          >
            The all-in-one collaboration platform combining Discord-style chat
            with powerful Kanban task management.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5865f2]/20 rounded-lg flex items-center justify-center text-xl">
                💬
              </div>
              <div>
                <h3 className="text-white">Real-time Chat</h3>
                <p className="text-[#b5bac1] text-sm">
                  Discord-style messaging with mentions & reactions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5865f2]/20 rounded-lg flex items-center justify-center text-xl">
                📋
              </div>
              <div>
                <h3 className="text-white">Kanban Boards</h3>
                <p className="text-[#b5bac1] text-sm">
                  Drag & drop task management
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - Auth Forms */}
        <div className="flex-1 max-w-md w-full">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <LoginForm
                key="login"
                onSuccess={onAuthSuccess}
                onSwitchToRegister={() => setIsLogin(false)}
              />
            ) : (
              <RegisterForm
                key="register"
                onSwitchToLogin={() => setIsLogin(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
      ></motion.div>
    </div>
  );
}
