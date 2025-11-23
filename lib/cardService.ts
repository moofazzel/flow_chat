import { createClient } from "@/utils/supabase/client";

export interface CardData {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  task_type: "story" | "task" | "bug" | "epic" | "subtask";
  priority: "lowest" | "low" | "medium" | "high" | "highest" | "urgent";
  story_points?: number;
  assignees: string[];
  reporter_id?: string;
  labels: Array<{ id: string; name: string; color: string }>;
  epic_link?: string;
  due_date?: string;
  start_date?: string;
  completed: boolean;
  archived: boolean;
  source_message_id?: string; // Link to chat message
  created_at: string;
  updated_at: string;
}

export async function createCard(
  listId: string,
  data: {
    title: string;
    description?: string;
    priority?: CardData["priority"];
    assignees?: string[];
    sourceMessageId?: string;
  }
): Promise<{ success: boolean; card?: CardData; error?: string }> {
  const supabase = createClient();

  // Get max position
  const { data: existing } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (existing?.[0]?.position ?? 0) + 1;

  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      list_id: listId,
      title: data.title,
      description: data.description,
      position,
      priority: data.priority || "medium",
      assignees: data.assignees || [],
      source_message_id: data.sourceMessageId,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, card: card as CardData };
}

export async function updateCard(
  cardId: string,
  updates: Partial<CardData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("cards")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", cardId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function moveCard(
  cardId: string,
  newListId: string,
  newPosition: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("cards")
    .update({
      list_id: newListId,
      position: newPosition,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteCard(
  cardId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("cards").delete().eq("id", cardId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getCardsByList(listId: string): Promise<CardData[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("cards")
    .select("*")
    .eq("list_id", listId)
    .eq("archived", false)
    .order("position", { ascending: true });

  return (data as CardData[]) || [];
}

export async function createCardFromMessage(
  listId: string,
  messageId: string,
  title: string,
  description?: string
): Promise<{ success: boolean; card?: CardData; error?: string }> {
  return await createCard(listId, {
    title,
    description,
    sourceMessageId: messageId,
  });
}
