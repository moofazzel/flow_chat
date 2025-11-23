import { createClient } from "@/utils/supabase/client";

export interface Board {
  id: string;
  server_id?: string;
  title: string;
  description?: string;
  background?: string;
  visibility: "public" | "private" | "server";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  color?: string;
  wip_limit?: number;
  created_at: string;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: "admin" | "member" | "observer";
  added_at: string;
}

/**
 * Create a new board
 */
export async function createBoard(
  title: string,
  createdBy: string,
  serverId?: string,
  description?: string,
  background?: string,
  visibility: Board["visibility"] = "public"
): Promise<{ success: boolean; board?: Board; error?: string }> {
  const supabase = createClient();

  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      title,
      description,
      background,
      visibility,
      created_by: createdBy,
      server_id: serverId || null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Auto-add creator as admin member
  await supabase.from("board_members").insert({
    board_id: board.id,
    user_id: createdBy,
    role: "admin",
  });

  return { success: true, board: board as Board };
}

/**
 * Get user's boards (both personal and server boards)
 */
export async function getUserBoards(userId: string): Promise<Board[]> {
  const supabase = createClient();

  const { data: memberships } = await supabase
    .from("board_members")
    .select("board_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const boardIds = memberships.map((m) => m.board_id);

  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .in("id", boardIds)
    .order("created_at", { ascending: false });

  return (boards as Board[]) || [];
}

/**
 * Get boards for a specific server
 */
export async function getServerBoards(serverId: string): Promise<Board[]> {
  const supabase = createClient();

  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .eq("server_id", serverId)
    .order("created_at", { ascending: false });

  return (boards as Board[]) || [];
}

/**
 * Get a single board by ID
 */
export async function getBoardById(boardId: string): Promise<Board | null> {
  const supabase = createClient();

  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  return (board as Board) || null;
}

/**
 * Create a list in a board
 */
export async function createList(
  boardId: string,
  title: string,
  color?: string,
  wipLimit?: number
): Promise<{ success: boolean; list?: List; error?: string }> {
  const supabase = createClient();

  // Get max position for ordering
  const { data: existingLists } = await supabase
    .from("lists")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (existingLists?.[0]?.position ?? 0) + 1;

  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      board_id: boardId,
      title,
      position,
      color,
      wip_limit: wipLimit,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, list: list as List };
}

/**
 * Get all lists for a board
 */
export async function getBoardLists(boardId: string): Promise<List[]> {
  const supabase = createClient();

  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  return (lists as List[]) || [];
}

/**
 * Update board
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<
    Pick<Board, "title" | "description" | "background" | "visibility">
  >
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("boards")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", boardId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete board
 */
export async function deleteBoard(
  boardId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Update list
 */
export async function updateList(
  listId: string,
  updates: Partial<Pick<List, "title" | "color" | "wip_limit" | "position">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("lists")
    .update(updates)
    .eq("id", listId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete list
 */
export async function deleteList(
  listId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("lists").delete().eq("id", listId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Add member to board
 */
export async function addBoardMember(
  boardId: string,
  userId: string,
  role: BoardMember["role"] = "member"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("board_members").insert({
    board_id: boardId,
    user_id: userId,
    role,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get board members
 */
export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const supabase = createClient();

  const { data: members } = await supabase
    .from("board_members")
    .select("*")
    .eq("board_id", boardId);

  return (members as BoardMember[]) || [];
}

/**
 * Remove board member
 */
export async function removeBoardMember(
  boardId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("board_id", boardId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
