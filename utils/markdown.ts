/**
 * Markdown utilities for message formatting
 */

/**
 * Extract user mentions from message content
 * @param content Message content
 * @returns Array of mentioned user IDs
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // User ID is in the second capture group
  }

  return mentions;
}

/**
 * Extract task mentions from message content
 * @param content Message content
 * @returns Array of task IDs
 */
export function extractTaskMentions(content: string): string[] {
  const taskRegex = /#\[([^\]]+)\]\(([^)]+)\)/g;
  const tasks: string[] = [];
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push(match[2]); // Task ID is in the second capture group
  }

  return tasks;
}

/**
 * Format user mention for display
 * @param username Username to mention
 * @param userId User ID
 * @returns Formatted mention string
 */
export function formatUserMention(username: string, userId: string): string {
  return `@[${username}](${userId})`;
}

/**
 * Format task mention for display
 * @param taskTitle Task title
 * @param taskId Task ID
 * @returns Formatted task mention string
 */
export function formatTaskMention(taskTitle: string, taskId: string): string {
  return `#[${taskTitle}](${taskId})`;
}

/**
 * Sanitize markdown content (prevent XSS)
 */
export function sanitizeMarkdown(content: string): string {
  // Basic sanitization - you may want to use a library like DOMPurify for production
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Check if content contains markdown formatting
 */
export function hasMarkdown(content: string): boolean {
  const markdownPatterns = [
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /~~.*?~~/, // Strikethrough
    /`.*?`/, // Inline code
    /```[\s\S]*?```/, // Code block
    /\[.*?\]\(.*?\)/, // Links
    /^#{1,6}\s/m, // Headers
    /^>\s/m, // Blockquote
    /^[-*+]\s/m, // List
    /^\d+\.\s/m, // Ordered list
  ];

  return markdownPatterns.some((pattern) => pattern.test(content));
}

/**
 * Insert text at cursor position in textarea
 */
export function insertAtCursor(
  textarea: HTMLTextAreaElement,
  textToInsert: string
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const before = text.substring(0, start);
  const after = text.substring(end);

  textarea.value = before + textToInsert + after;

  // Move cursor to end of inserted text
  const newPosition = start + textToInsert.length;
  textarea.setSelectionRange(newPosition, newPosition);
  textarea.focus();
}

/**
 * Wrap selected text with markdown formatting
 */
export function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);

  const replacement = before + selectedText + after;
  const before_text = text.substring(0, start);
  const after_text = text.substring(end);

  textarea.value = before_text + replacement + after_text;

  // Select the wrapped text
  textarea.setSelectionRange(
    start + before.length,
    start + before.length + selectedText.length
  );
  textarea.focus();
}

/**
 * Apply markdown formatting to textarea
 */
export function applyMarkdownFormat(
  textarea: HTMLTextAreaElement,
  format:
    | "bold"
    | "italic"
    | "strikethrough"
    | "code"
    | "codeblock"
    | "link"
    | "quote"
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const hasSelection = start !== end;

  switch (format) {
    case "bold":
      wrapSelection(textarea, "**");
      break;
    case "italic":
      wrapSelection(textarea, "*");
      break;
    case "strikethrough":
      wrapSelection(textarea, "~~");
      break;
    case "code":
      wrapSelection(textarea, "`");
      break;
    case "codeblock":
      if (hasSelection) {
        wrapSelection(textarea, "```\n", "\n```");
      } else {
        insertAtCursor(textarea, "```\n\n```");
        textarea.setSelectionRange(start + 4, start + 4);
      }
      break;
    case "link":
      if (hasSelection) {
        const selectedText = textarea.value.substring(start, end);
        insertAtCursor(textarea, `[${selectedText}](url)`);
      } else {
        insertAtCursor(textarea, "[text](url)");
        textarea.setSelectionRange(start + 1, start + 5);
      }
      break;
    case "quote":
      const text = textarea.value;
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = text.indexOf("\n", end);
      const actualEnd = lineEnd === -1 ? text.length : lineEnd;

      const lines = text.substring(lineStart, actualEnd).split("\n");
      const quotedLines = lines.map((line) => `> ${line}`).join("\n");

      const before = text.substring(0, lineStart);
      const after = text.substring(actualEnd);

      textarea.value = before + quotedLines + after;
      textarea.setSelectionRange(lineStart, lineStart + quotedLines.length);
      textarea.focus();
      break;
  }
}
