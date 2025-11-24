import { hasMarkdown, sanitizeMarkdown } from "@/utils/markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  content: string;
  onUserMentionClick?: (userId: string) => void;
  onTaskMentionClick?: (taskId: string) => void;
}

export function MarkdownMessage({
  content,
  onUserMentionClick,
  onTaskMentionClick,
}: MarkdownMessageProps) {
  // Check if content has markdown, otherwise render as plain text for performance
  const useMarkdown = hasMarkdown(content);

  // Process custom mentions
  const processedContent = content
    .replace(
      /@\[([^\]]+)\]\(([^)]+)\)/g,
      (match, username, userId) => `[@${username}](#user-${userId})`
    )
    .replace(
      /#\[([^\]]+)\]\(([^)]+)\)/g,
      (match, taskTitle, taskId) => `[#${taskTitle}](#task-${taskId})`
    );

  const sanitizedContent = sanitizeMarkdown(processedContent);

  if (!useMarkdown) {
    // Plain text with custom mentions
    return (
      <div className="whitespace-pre-wrap wrap-break-word">
        {processedContent
          .split(/(@\[[^\]]+\]\([^)]+\)|#\[[^\]]+\]\([^)]+\))/)
          .map((part, i) => {
            // User mention
            const userMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
            if (userMatch) {
              return (
                <button
                  key={i}
                  onClick={() => onUserMentionClick?.(userMatch[2])}
                  className="text-blue-500 hover:underline font-medium"
                >
                  @{userMatch[1]}
                </button>
              );
            }

            // Task mention
            const taskMatch = part.match(/#\[([^\]]+)\]\(([^)]+)\)/);
            if (taskMatch) {
              return (
                <button
                  key={i}
                  onClick={() => onTaskMentionClick?.(taskMatch[2])}
                  className="text-purple-500 hover:underline font-medium"
                >
                  #{taskMatch[1]}
                </button>
              );
            }

            return <span key={i}>{part}</span>;
          })}
      </div>
    );
  }

  return (
    <div className="markdown-message prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            // Handle user mentions
            if (href?.startsWith("#user-")) {
              const userId = href.replace("#user-", "");
              return (
                <button
                  type="button"
                  onClick={() => onUserMentionClick?.(userId)}
                  className="text-blue-500 hover:underline font-medium"
                >
                  {children}
                </button>
              );
            }

            // Handle task mentions
            if (href?.startsWith("#task-")) {
              const taskId = href.replace("#task-", "");
              return (
                <button
                  type="button"
                  onClick={() => onTaskMentionClick?.(taskId)}
                  className="text-purple-500 hover:underline font-medium"
                >
                  {children}
                </button>
              );
            }

            // Regular links
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
            const inline = !props.className;
            if (inline) {
              return (
                <code
                  className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block bg-gray-200 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2"
              {...props}
            >
              {children}
            </blockquote>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside my-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside my-2" {...props}>
              {children}
            </ol>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold my-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold my-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-bold my-2" {...props}>
              {children}
            </h3>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
