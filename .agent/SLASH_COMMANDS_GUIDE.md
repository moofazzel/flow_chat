# Slash Commands Implementation Guide

## 🎯 Overview

This guide provides the complete implementation for slash commands in the chat system, allowing users to quickly create tasks using commands like `/task`, `/bug`, `/story`.

---

## 📋 Implementation Steps

### Step 1: Add Slash Command State

Add state to track slash command input:

```typescript
// In the component with message input (likely page.tsx or a chat input component)
const [isSlashCommand, setIsSlashCommand] = useState(false);
const [slashCommandData, setSlashCommandData] = useState<{
  type: "task" | "bug" | "story";
  title: string;
} | null>(null);
```

### Step 2: Create Slash Command Parser

```typescript
const parseSlashCommand = (
  message: string
): {
  isCommand: boolean;
  type?: "task" | "bug" | "story";
  title?: string;
} => {
  if (!message.startsWith("/")) {
    return { isCommand: false };
  }

  const parts = message.split(" ");
  const command = parts[0].toLowerCase();
  const title = parts.slice(1).join(" ");

  switch (command) {
    case "/task":
      return { isCommand: true, type: "task", title };
    case "/bug":
      return { isCommand: true, type: "bug", title };
    case "/story":
      return { isCommand: true, type: "story", title };
    default:
      return { isCommand: false };
  }
};
```

### Step 3: Handle Message Submit

```typescript
const handleMessageSubmit = (message: string) => {
  const command = parseSlashCommand(message);

  if (command.isCommand && command.type && command.title) {
    // Open QuickTaskCreate with pre-filled data
    setSlashCommandData({
      type: command.type,
      title: command.title,
    });
    setQuickTaskOpen(true);

    // Clear the input
    setMessage("");
    return;
  }

  // Normal message send
  sendMessage(message);
};
```

### Step 4: Update QuickTaskCreate Pre-fill

```typescript
<QuickTaskCreate
  open={quickTaskOpen}
  onOpenChange={setQuickTaskOpen}
  onCreateTask={handleQuickTaskCreate}
  prefilledData={
    slashCommandData
      ? {
          title: slashCommandData.title,
          issueType: slashCommandData.type,
          priority: "medium",
        }
      : selectedMessageForTask
      ? {
          title: selectedMessageForTask.content
            .split(/[.!?]/)[0]
            .substring(0, 100),
          description: selectedMessageForTask.content,
          priority: detectPriority(selectedMessageForTask.content),
          sourceMessageId: selectedMessageForTask.id,
          sourceMessageContent: selectedMessageForTask.content,
          sourceMessageAuthor: selectedMessageForTask.author,
        }
      : undefined
  }
/>
```

### Step 5: Clear Slash Command Data on Close

```typescript
const handleQuickTaskClose = () => {
  setQuickTaskOpen(false);
  setSlashCommandData(null);
  setSelectedMessageForTask(null);
};
```

---

## 🎨 Enhanced UI - Command Suggestions

### Add Command Autocomplete

```typescript
const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);

const slashCommands = [
  {
    command: "/task",
    description: "Create a new task",
    icon: "✓",
    example: "/task Fix login bug",
  },
  {
    command: "/bug",
    description: "Report a bug",
    icon: "🐛",
    example: "/bug User can't upload files",
  },
  {
    command: "/story",
    description: "Create a user story",
    icon: "📖",
    example: "/story Add dark mode support",
  },
];

// In message input onChange
const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setMessage(value);

  // Show command suggestions when user types /
  if (value.startsWith("/") && value.length <= 10) {
    setShowCommandSuggestions(true);
  } else {
    setShowCommandSuggestions(false);
  }
};
```

### Command Suggestions UI

```tsx
{
  showCommandSuggestions && (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden">
      {slashCommands
        .filter((cmd) => cmd.command.startsWith(message.toLowerCase()))
        .map((cmd) => (
          <button
            key={cmd.command}
            onClick={() => {
              setMessage(cmd.command + " ");
              setShowCommandSuggestions(false);
              inputRef.current?.focus();
            }}
            className="w-full px-3 py-2 text-left hover:bg-[#35363c] transition-colors flex items-start gap-3"
          >
            <span className="text-2xl">{cmd.icon}</span>
            <div className="flex-1">
              <div className="text-white font-medium">{cmd.command}</div>
              <div className="text-gray-400 text-xs">{cmd.description}</div>
              <div className="text-gray-500 text-xs mt-1 italic">
                {cmd.example}
              </div>
            </div>
          </button>
        ))}
    </div>
  );
}
```

---

## 🚀 Advanced Features

### Priority in Command

```typescript
const parseSlashCommand = (message: string) => {
  if (!message.startsWith("/")) {
    return { isCommand: false };
  }

  const parts = message.split(" ");
  const command = parts[0].toLowerCase();

  // Extract priority flag
  const priorityMatch = message.match(/priority:(low|medium|high|urgent)/i);
  const priority = priorityMatch ? priorityMatch[1].toLowerCase() : "medium";

  // Remove priority flag from title
  const title = parts
    .slice(1)
    .join(" ")
    .replace(/priority:(low|medium|high|urgent)/i, "")
    .trim();

  switch (command) {
    case "/task":
      return { isCommand: true, type: "task", title, priority };
    case "/bug":
      return { isCommand: true, type: "bug", title, priority };
    case "/story":
      return { isCommand: true, type: "story", title, priority };
    default:
      return { isCommand: false };
  }
};
```

### Assignee in Command

```typescript
// Extract assignee
const assigneeMatch = message.match(/@(\w+)/);
const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

// Remove assignee from title
const title = parts
  .slice(1)
  .join(" ")
  .replace(/priority:(low|medium|high|urgent)/i, "")
  .replace(/@\w+/, "")
  .trim();
```

### Usage Examples

```
/task Fix login bug priority:urgent @john
/bug User can't upload files priority:high
/story Add dark mode support @sarah
```

---

## 📝 Complete Implementation

### Full Component Integration

```typescript
import { useState, useRef } from "react";
import { QuickTaskCreate } from "./QuickTaskCreate";

export function ChatInput({ onSendMessage, onCreateTask }) {
  const [message, setMessage] = useState("");
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [slashCommandData, setSlashCommandData] = useState(null);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const inputRef = useRef(null);

  const parseSlashCommand = (message) => {
    if (!message.startsWith("/")) {
      return { isCommand: false };
    }

    const parts = message.split(" ");
    const command = parts[0].toLowerCase();

    // Extract flags
    const priorityMatch = message.match(/priority:(low|medium|high|urgent)/i);
    const priority = priorityMatch ? priorityMatch[1].toLowerCase() : "medium";

    const assigneeMatch = message.match(/@(\w+)/);
    const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

    // Clean title
    const title = parts
      .slice(1)
      .join(" ")
      .replace(/priority:(low|medium|high|urgent)/i, "")
      .replace(/@\w+/, "")
      .trim();

    switch (command) {
      case "/task":
        return { isCommand: true, type: "task", title, priority, assignee };
      case "/bug":
        return { isCommand: true, type: "bug", title, priority, assignee };
      case "/story":
        return { isCommand: true, type: "story", title, priority, assignee };
      default:
        return { isCommand: false };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const command = parseSlashCommand(message);

    if (command.isCommand && command.type && command.title) {
      // Open QuickTaskCreate
      setSlashCommandData({
        type: command.type,
        title: command.title,
        priority: command.priority,
        assignee: command.assignee,
      });
      setQuickTaskOpen(true);
      setMessage("");
      return;
    }

    // Normal message
    onSendMessage(message);
    setMessage("");
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Show suggestions
    if (value.startsWith("/") && value.length <= 10) {
      setShowCommandSuggestions(true);
    } else {
      setShowCommandSuggestions(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative">
        {/* Command Suggestions */}
        {showCommandSuggestions && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl">
            {slashCommands
              .filter((cmd) => cmd.command.startsWith(message.toLowerCase()))
              .map((cmd) => (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => {
                    setMessage(cmd.command + " ");
                    setShowCommandSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#35363c] transition-colors flex items-start gap-3"
                >
                  <span className="text-2xl">{cmd.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{cmd.command}</div>
                    <div className="text-gray-400 text-xs">
                      {cmd.description}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleMessageChange}
          placeholder="Message or use /task, /bug, /story"
          className="w-full bg-[#383a40] text-white rounded-lg px-4 py-3"
        />
      </form>

      {/* QuickTaskCreate Modal */}
      <QuickTaskCreate
        open={quickTaskOpen}
        onOpenChange={(open) => {
          setQuickTaskOpen(open);
          if (!open) setSlashCommandData(null);
        }}
        onCreateTask={onCreateTask}
        prefilledData={slashCommandData}
      />
    </>
  );
}
```

---

## ✅ Testing Checklist

- [ ] `/task` command opens modal with correct type
- [ ] `/bug` command opens modal with correct type
- [ ] `/story` command opens modal with correct type
- [ ] Title is extracted correctly
- [ ] Priority flag works (`priority:high`)
- [ ] Assignee flag works (`@username`)
- [ ] Command suggestions appear on `/`
- [ ] Clicking suggestion fills command
- [ ] Invalid commands send as normal messages
- [ ] Empty commands don't create tasks
- [ ] Modal closes properly
- [ ] Input clears after command

---

## 🎯 Success Criteria

✅ Users can create tasks with `/task <title>`  
✅ Bug reports with `/bug <title>`  
✅ User stories with `/story <title>`  
✅ Priority can be set with `priority:high`  
✅ Assignee can be set with `@username`  
✅ Command suggestions help discovery  
✅ Invalid commands handled gracefully

---

## 📊 Estimated Implementation Time

- Basic slash commands: 30 minutes
- Command suggestions UI: 20 minutes
- Priority/assignee flags: 10 minutes
- Testing and polish: 20 minutes

**Total: ~1.5 hours**

---

## 🚀 Next Steps

1. Find the message input component (likely in `page.tsx` or a separate `ChatInput` component)
2. Add the slash command parsing logic
3. Integrate with QuickTaskCreate
4. Add command suggestions UI
5. Test all commands
6. Update documentation

---

**Status:** Ready to implement  
**Priority:** High  
**Complexity:** Medium  
**Impact:** High - Significantly improves task creation speed
