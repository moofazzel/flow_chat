import { motion } from "framer-motion";

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-2 px-2 py-1">
      {/* Avatar skeleton */}
      <div className="h-7 w-7 sm:h-8 sm:w-8 mt-1 shrink-0 rounded-full bg-gray-700 animate-pulse" />

      <div className="flex-1 min-w-0 space-y-2">
        {/* Username and timestamp skeleton */}
        <div className="flex items-baseline gap-2">
          <div className="h-3 w-20 sm:w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-2 w-12 bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Message content skeleton */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ChatLoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.1,
            duration: 0.3,
          }}
        >
          <ChatMessageSkeleton />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function ChatEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-32 text-gray-500"
    >
      <svg
        className="w-12 h-12 mb-3 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <p className="text-sm font-medium">No messages yet</p>
      <p className="text-xs mt-1">Start the conversation!</p>
    </motion.div>
  );
}
