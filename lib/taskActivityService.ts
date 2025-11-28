import { Embed, sendChannelMessage } from "./channelMessageService";

export type TaskActivityType =
  | "task_created"
  | "task_status_changed"
  | "task_completed"
  | "task_reopened"
  | "task_assigned"
  | "task_unassigned"
  | "task_priority_changed"
  | "task_due_date_set"
  | "task_due_date_changed"
  | "task_due_date_removed"
  | "task_label_added"
  | "task_label_removed"
  | "task_title_changed"
  | "task_description_changed"
  | "subtask_added"
  | "subtask_completed"
  | "subtask_uncompleted"
  | "subtask_deleted"
  | "attachment_added"
  | "attachment_deleted";

interface TaskActivityData {
  taskId: string;
  taskTitle: string;
  actorName: string; // Person who made the change
  actorId: string;
  channelId: string;
  boardName?: string;
  // Change-specific data
  oldValue?: string;
  newValue?: string;
  memberName?: string;
  labelName?: string;
  subtaskTitle?: string;
  attachmentName?: string;
}

// Format activity message based on type
function formatActivityMessage(
  type: TaskActivityType,
  data: TaskActivityData
): string {
  const {
    taskTitle,
    actorName,
    oldValue,
    newValue,
    memberName,
    labelName,
    subtaskTitle,
    attachmentName,
  } = data;

  // Emoji mapping for different activity types
  const emojis: Record<TaskActivityType, string> = {
    task_created: "✨",
    task_status_changed: "📋",
    task_completed: "✅",
    task_reopened: "🔄",
    task_assigned: "👤",
    task_unassigned: "👤",
    task_priority_changed: "🎯",
    task_due_date_set: "📅",
    task_due_date_changed: "📅",
    task_due_date_removed: "📅",
    task_label_added: "🏷️",
    task_label_removed: "🏷️",
    task_title_changed: "✏️",
    task_description_changed: "📝",
    subtask_added: "☑️",
    subtask_completed: "✅",
    subtask_uncompleted: "⬜",
    subtask_deleted: "🗑️",
    attachment_added: "📎",
    attachment_deleted: "📎",
  };

  const emoji = emojis[type] || "📌";

  switch (type) {
    case "task_created":
      return `${emoji} **${actorName}** created task: **${taskTitle}**`;

    case "task_status_changed":
      return `${emoji} **${actorName}** moved **${taskTitle}** from *${oldValue}* to *${newValue}*`;

    case "task_completed":
      return `${emoji} **${actorName}** completed task: **${taskTitle}** 🎉`;

    case "task_reopened":
      return `${emoji} **${actorName}** reopened task: **${taskTitle}**`;

    case "task_assigned":
      return `${emoji} **${actorName}** assigned **${memberName}** to **${taskTitle}**`;

    case "task_unassigned":
      return `${emoji} **${actorName}** removed **${memberName}** from **${taskTitle}**`;

    case "task_priority_changed":
      return `${emoji} **${actorName}** changed priority of **${taskTitle}** from *${oldValue}* to *${newValue}*`;

    case "task_due_date_set":
      return `${emoji} **${actorName}** set due date for **${taskTitle}**: *${newValue}*`;

    case "task_due_date_changed":
      return `${emoji} **${actorName}** changed due date of **${taskTitle}** from *${oldValue}* to *${newValue}*`;

    case "task_due_date_removed":
      return `${emoji} **${actorName}** removed due date from **${taskTitle}**`;

    case "task_label_added":
      return `${emoji} **${actorName}** added label *${labelName}* to **${taskTitle}**`;

    case "task_label_removed":
      return `${emoji} **${actorName}** removed label *${labelName}* from **${taskTitle}**`;

    case "task_title_changed":
      return `${emoji} **${actorName}** renamed task from *${oldValue}* to **${newValue}**`;

    case "task_description_changed":
      return `${emoji} **${actorName}** updated description of **${taskTitle}**`;

    case "subtask_added":
      return `${emoji} **${actorName}** added checklist item "*${subtaskTitle}*" to **${taskTitle}**`;

    case "subtask_completed":
      return `${emoji} **${actorName}** completed "*${subtaskTitle}*" in **${taskTitle}**`;

    case "subtask_uncompleted":
      return `${emoji} **${actorName}** unchecked "*${subtaskTitle}*" in **${taskTitle}**`;

    case "subtask_deleted":
      return `${emoji} **${actorName}** removed checklist item "*${subtaskTitle}*" from **${taskTitle}**`;

    case "attachment_added":
      return `${emoji} **${actorName}** attached *${attachmentName}* to **${taskTitle}**`;

    case "attachment_deleted":
      return `${emoji} **${actorName}** removed attachment *${attachmentName}* from **${taskTitle}**`;

    default:
      return `📌 **${actorName}** updated **${taskTitle}**`;
  }
}

// Send task activity to channel
export async function sendTaskActivity(
  type: TaskActivityType,
  data: TaskActivityData
): Promise<{ success: boolean; error?: string }> {
  if (!data.channelId) {
    console.warn("No channel ID provided for task activity");
    return { success: false, error: "No channel ID" };
  }

  const message = formatActivityMessage(type, data);

  // Create embed with task reference
  const embed: Embed = {
    type: "task",
    task_id: data.taskId,
    title: data.taskTitle,
    description: data.boardName ? `Board: ${data.boardName}` : undefined,
  };

  try {
    const result = await sendChannelMessage(
      data.channelId,
      data.actorId,
      message,
      {
        embeds: [embed],
      }
    );

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("Failed to send task activity:", error);
    return { success: false, error: "Failed to send activity message" };
  }
}

// Helper function to get priority display name
export function getPriorityDisplayName(priority: string): string {
  const names: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  };
  return names[priority] || priority;
}

// Helper function to format date for display
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
