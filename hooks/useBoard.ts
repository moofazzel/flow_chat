import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface Board {
  id: string;
  title: string;
  background: string;
  created_by: string;
  created_at: string;
  lists?: List[];
  members?: BoardMember[];
  labels?: BoardLabel[];
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  cards?: Card[];
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  priority: "low" | "medium" | "high" | "urgent";
  assignees: string[];
  labels: string[];
  due_date: string | null;
  completed?: boolean;
  archived?: boolean;
}

export interface CardComment {
  id: string;
  card_id: string;
  author_id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface CardSubtask {
  id: string;
  card_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface CardAttachment {
  id: string;
  card_id: string;
  uploader_id: string;
  filename: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: "admin" | "member" | "observer";
  added_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface BoardLabel {
  id: string;
  board_id: string;
  name: string;
  color: string;
  text_color: string;
  created_at: string;
}

export const useBoard = (boardId?: string, serverId?: string | null) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Extracted fetch function so it can be called manually
  const fetchBoards = async () => {
    let query = supabase.from("boards").select(`
      *,
      lists:lists (
        id,
        board_id,
        title,
        position,
        cards:cards (*)
      )
    `);

    // Filter by serverId if provided, otherwise get personal boards (null server_id)
    if (serverId !== undefined) {
      query = query.eq("server_id", serverId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      toast.error("Failed to load boards");
      console.error(error);
    } else {
      // Sort lists and cards by position
      const sortedData = (data || []).map((board) => {
        if (board.lists) {
          board.lists.sort((a: List, b: List) => a.position - b.position);
          board.lists.forEach((list: List & { cards?: Card[] }) => {
            if (list.cards) {
              list.cards.sort((a: Card, b: Card) => a.position - b.position);
            }
          });
        }
        return board;
      });
      setBoards(sortedData);
    }
    setIsLoading(false);
  };

  // Fetch boards on mount and when serverId changes
  useEffect(() => {
    fetchBoards();

    // Real-time subscription for boards updates
    const channel = supabase
      .channel("boards-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boards" },
        () => fetchBoards()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        () => fetchBoards()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards" },
        () => fetchBoards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Fetch specific board details (lists and cards)
  useEffect(() => {
    if (!boardId) return;

    const fetchBoardDetails = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("boards")
        .select(
          `
          *,
          lists:lists (
            *,
            cards:cards (*)
          )
        `
        )
        .eq("id", boardId)
        .single();

      if (error) {
        console.error("Error fetching board details:", error);
      } else {
        // Sort lists and cards by position
        if (data.lists) {
          data.lists.sort((a: List, b: List) => a.position - b.position);
          data.lists.forEach((list: List & { cards?: Card[] }) => {
            if (list.cards) {
              list.cards.sort((a: Card, b: Card) => a.position - b.position);
            }
          });
        }
        setCurrentBoard(data);
      }
      setIsLoading(false);
    };

    fetchBoardDetails();

    // Real-time subscription for board updates
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `board_id=eq.${boardId}`,
        },
        () => fetchBoardDetails()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards" }, // Ideally filter by list_ids, but simpler to refresh for now
        () => fetchBoardDetails()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const createBoard = async (
    title: string,
    background: string,
    serverId?: string | null
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("boards")
      .insert({
        title,
        background,
        created_by: user.id,
        server_id: serverId || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create board");
      return null;
    }

    // Auto-add creator as board admin
    await supabase.from("board_members").insert({
      board_id: data.id,
      user_id: user.id,
      role: "admin",
    });

    setBoards((prev) => [data, ...prev]);
    return data;
  };

  const updateBoard = async (boardId: string, updates: Partial<Board>) => {
    const { error } = await supabase
      .from("boards")
      .update(updates)
      .eq("id", boardId);

    if (error) {
      toast.error("Failed to update board");
    } else {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, ...updates } : b))
      );
      if (currentBoard?.id === boardId) {
        setCurrentBoard((prev) => (prev ? { ...prev, ...updates } : null));
      }
    }
  };

  const deleteBoard = async (boardId: string) => {
    const { error } = await supabase.from("boards").delete().eq("id", boardId);

    if (error) {
      toast.error("Failed to delete board");
    } else {
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      if (currentBoard?.id === boardId) {
        setCurrentBoard(null);
      }
    }
  };

  const createList = async (
    boardId: string,
    title: string,
    position: number
  ) => {
    const { data, error } = await supabase
      .from("lists")
      .insert({ board_id: boardId, title, position })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create list");
      return null;
    }

    // Update local state
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          const newList = { ...data, cards: [] };
          return {
            ...board,
            lists: [...(board.lists || []), newList].sort(
              (a, b) => a.position - b.position
            ),
          };
        }
        return board;
      })
    );

    return data;
  };

  const updateList = async (listId: string, updates: Partial<List>) => {
    const { error } = await supabase
      .from("lists")
      .update(updates)
      .eq("id", listId);

    if (error) toast.error("Failed to update list");
  };

  const deleteList = async (listId: string) => {
    const { error } = await supabase.from("lists").delete().eq("id", listId);

    if (error) {
      toast.error("Failed to delete list");
    } else {
      // Update local state
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists?.filter((list) => list.id !== listId),
        }))
      );
    }
  };

  const createCard = async (
    listId: string,
    title: string,
    description: string = "",
    position?: number
  ) => {
    // Calculate position if not provided
    let cardPosition = position;
    if (cardPosition === undefined) {
      // Find the list and get the next position
      for (const board of boards) {
        const list = board.lists?.find((l) => l.id === listId);
        if (list) {
          cardPosition = list.cards?.length || 0;
          break;
        }
      }
    }

    const { data, error } = await supabase
      .from("cards")
      .insert({
        list_id: listId,
        title,
        description,
        position: cardPosition || 0,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create card");
      return null;
    }

    // Update local state
    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        lists: board.lists?.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              cards: [...(list.cards || []), data].sort(
                (a, b) => a.position - b.position
              ),
            };
          }
          return list;
        }),
      }))
    );

    toast.success("Card created");
    return data;
  };

  const updateCardPosition = async (
    cardId: string,
    newListId: string,
    newPosition: number
  ) => {
    // Optimistic update - update local state first
    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        lists: board.lists?.map((list) => {
          // Remove card from old list
          if (list.cards?.some((c) => c.id === cardId)) {
            return {
              ...list,
              cards: list.cards.filter((c) => c.id !== cardId),
            };
          }
          // Add card to new list
          if (list.id === newListId) {
            const movedCard = prev
              .flatMap((b) => b.lists || [])
              .flatMap((l) => l.cards || [])
              .find((c) => c.id === cardId);
            if (movedCard) {
              return {
                ...list,
                cards: [
                  ...(list.cards || []),
                  { ...movedCard, list_id: newListId, position: newPosition },
                ].sort((a, b) => a.position - b.position),
              };
            }
          }
          return list;
        }),
      }))
    );

    // Update in database
    const { error } = await supabase
      .from("cards")
      .update({ list_id: newListId, position: newPosition })
      .eq("id", cardId);

    if (error) toast.error("Failed to move card");
  };

  const deleteCard = async (cardId: string) => {
    const { error } = await supabase.from("cards").delete().eq("id", cardId);

    if (error) {
      toast.error("Failed to delete card");
    } else {
      // Update local state
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists?.map((list) => ({
            ...list,
            cards: list.cards?.filter((card) => card.id !== cardId),
          })),
        }))
      );
      toast.success("Card deleted");
    }
  };

  // ================================================================
  // CARD UPDATE OPERATIONS
  // ================================================================
  const updateCard = async (cardId: string, updates: Partial<Card>) => {
    const { error } = await supabase
      .from("cards")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", cardId);

    if (error) {
      toast.error("Failed to update card");
      return false;
    }

    // Update local state
    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        lists: board.lists?.map((list) => ({
          ...list,
          cards: list.cards?.map((card) =>
            card.id === cardId ? { ...card, ...updates } : card
          ),
        })),
      }))
    );

    return true;
  };

  // ================================================================
  // CARD COMMENTS OPERATIONS
  // ================================================================
  const getCardComments = async (cardId: string): Promise<CardComment[]> => {
    const { data, error } = await supabase
      .from("card_comments")
      .select(
        `
        *,
        author:users!card_comments_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("card_id", cardId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch comments:", error);
      return [];
    }

    return data as CardComment[];
  };

  const addCardComment = async (
    cardId: string,
    content: string
  ): Promise<CardComment | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to comment");
      return null;
    }

    const { data, error } = await supabase
      .from("card_comments")
      .insert({
        card_id: cardId,
        author_id: user.id,
        content,
      })
      .select(
        `
        *,
        author:users!card_comments_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      toast.error("Failed to add comment");
      return null;
    }

    toast.success("Comment added");
    return data as CardComment;
  };

  const updateCardComment = async (
    commentId: string,
    content: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("card_comments")
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to update comment");
      return false;
    }

    toast.success("Comment updated");
    return true;
  };

  const deleteCardComment = async (commentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("card_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
      return false;
    }

    toast.success("Comment deleted");
    return true;
  };

  // ================================================================
  // CARD SUBTASKS (CHECKLIST) OPERATIONS
  // ================================================================
  const getCardSubtasks = async (cardId: string): Promise<CardSubtask[]> => {
    const { data, error } = await supabase
      .from("card_subtasks")
      .select("*")
      .eq("card_id", cardId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch subtasks:", error);
      return [];
    }

    return data as CardSubtask[];
  };

  const addCardSubtask = async (
    cardId: string,
    title: string
  ): Promise<CardSubtask | null> => {
    // Get max position
    const { data: existing } = await supabase
      .from("card_subtasks")
      .select("position")
      .eq("card_id", cardId)
      .order("position", { ascending: false })
      .limit(1);

    const position = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from("card_subtasks")
      .insert({
        card_id: cardId,
        title,
        position,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add subtask");
      return null;
    }

    toast.success("Subtask added");
    return data as CardSubtask;
  };

  const toggleCardSubtask = async (
    subtaskId: string,
    completed: boolean
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("card_subtasks")
      .update({ completed })
      .eq("id", subtaskId);

    if (error) {
      toast.error("Failed to update subtask");
      return false;
    }

    return true;
  };

  const deleteCardSubtask = async (subtaskId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("card_subtasks")
      .delete()
      .eq("id", subtaskId);

    if (error) {
      toast.error("Failed to delete subtask");
      return false;
    }

    toast.success("Subtask deleted");
    return true;
  };

  // ================================================================
  // CARD ATTACHMENTS OPERATIONS
  // ================================================================
  const getCardAttachments = async (
    cardId: string
  ): Promise<CardAttachment[]> => {
    const { data, error } = await supabase
      .from("card_attachments")
      .select("*")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch attachments:", error);
      return [];
    }

    return data as CardAttachment[];
  };

  const uploadCardAttachment = async (
    cardId: string,
    file: File
  ): Promise<CardAttachment | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to upload files");
      return null;
    }

    // Upload file to Supabase storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${cardId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("card-attachments")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload file");
      console.error(uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("card-attachments")
      .getPublicUrl(fileName);

    // Create attachment record
    const { data, error } = await supabase
      .from("card_attachments")
      .insert({
        card_id: cardId,
        uploader_id: user.id,
        filename: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save attachment");
      return null;
    }

    toast.success("Attachment uploaded");
    return data as CardAttachment;
  };

  const deleteCardAttachment = async (
    attachmentId: string,
    fileUrl: string
  ): Promise<boolean> => {
    // Extract file path from URL and delete from storage
    try {
      const urlParts = fileUrl.split("/card-attachments/");
      if (urlParts[1]) {
        await supabase.storage.from("card-attachments").remove([urlParts[1]]);
      }
    } catch (e) {
      console.error("Error deleting file from storage:", e);
    }

    const { error } = await supabase
      .from("card_attachments")
      .delete()
      .eq("id", attachmentId);

    if (error) {
      toast.error("Failed to delete attachment");
      return false;
    }

    toast.success("Attachment deleted");
    return true;
  };

  // ================================================================
  // BOARD MEMBERS OPERATIONS
  // ================================================================
  const getBoardMembers = async (boardId: string): Promise<BoardMember[]> => {
    const { data, error } = await supabase
      .from("board_members")
      .select(
        `
        *,
        user:users!board_members_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("board_id", boardId);

    if (error) {
      console.error("Failed to fetch board members:", error);
      return [];
    }

    return data as BoardMember[];
  };

  const addBoardMember = async (
    boardId: string,
    userId: string,
    role: "admin" | "member" | "observer" = "member"
  ): Promise<BoardMember | null> => {
    const { data, error } = await supabase
      .from("board_members")
      .insert({
        board_id: boardId,
        user_id: userId,
        role,
      })
      .select(
        `
        *,
        user:users!board_members_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("User is already a member");
      } else {
        toast.error("Failed to add member");
      }
      return null;
    }

    toast.success("Member added");
    return data as BoardMember;
  };

  const removeBoardMember = async (memberId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error("Failed to remove member");
      return false;
    }

    toast.success("Member removed");
    return true;
  };

  // ================================================================
  // BOARD LABELS OPERATIONS
  // ================================================================
  const getBoardLabels = async (boardId: string): Promise<BoardLabel[]> => {
    const { data, error } = await supabase
      .from("board_labels")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch board labels:", error);
      return [];
    }

    return data as BoardLabel[];
  };

  const createBoardLabel = async (
    boardId: string,
    name: string,
    color: string,
    textColor: string = "text-white"
  ): Promise<BoardLabel | null> => {
    const { data, error } = await supabase
      .from("board_labels")
      .insert({
        board_id: boardId,
        name,
        color,
        text_color: textColor,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create label");
      return null;
    }

    toast.success("Label created");
    return data as BoardLabel;
  };

  const updateBoardLabel = async (
    labelId: string,
    updates: Partial<BoardLabel>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("board_labels")
      .update(updates)
      .eq("id", labelId);

    if (error) {
      toast.error("Failed to update label");
      return false;
    }

    toast.success("Label updated");
    return true;
  };

  const deleteBoardLabel = async (labelId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("board_labels")
      .delete()
      .eq("id", labelId);

    if (error) {
      toast.error("Failed to delete label");
      return false;
    }

    toast.success("Label deleted");
    return true;
  };

  // ================================================================
  // GET CURRENT USER
  // ================================================================
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .eq("id", user.id)
      .single();

    return data;
  };

  // ================================================================
  // SEARCH USERS / GET SERVER MEMBERS
  // ================================================================
  const searchUsers = async (
    query: string
  ): Promise<{ id: string; username: string; avatar_url: string | null }[]> => {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(10);

    if (error) {
      console.error("Failed to search users:", error);
      return [];
    }

    return data || [];
  };

  const getServerMembers = async (
    serverId: string
  ): Promise<{ id: string; username: string; avatar_url: string | null }[]> => {
    const { data, error } = await supabase
      .from("server_members")
      .select(
        `
        user_id,
        user:users!server_members_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("server_id", serverId);

    if (error) {
      console.error("Failed to fetch server members:", error);
      return [];
    }

    return (
      data?.map((m) => {
        const user = m.user as unknown as {
          id: string;
          username: string;
          avatar_url: string | null;
        };
        return {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
        };
      }) || []
    );
  };

  return {
    boards,
    currentBoard,
    isLoading,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    updateCardPosition,
    deleteCard,
    // Comments
    getCardComments,
    addCardComment,
    updateCardComment,
    deleteCardComment,
    // Subtasks
    getCardSubtasks,
    addCardSubtask,
    toggleCardSubtask,
    deleteCardSubtask,
    // Attachments
    getCardAttachments,
    uploadCardAttachment,
    deleteCardAttachment,
    // Members
    getBoardMembers,
    addBoardMember,
    removeBoardMember,
    // Labels
    getBoardLabels,
    createBoardLabel,
    updateBoardLabel,
    deleteBoardLabel,
    // User
    getCurrentUser,
    // Search/Server Members
    searchUsers,
    getServerMembers,
    // Manual refresh
    refreshBoards: fetchBoards,
  };
};
