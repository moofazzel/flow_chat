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
}

export const useBoard = (boardId?: string, serverId?: string | null) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch all boards (filtered by serverId if provided) with their lists
  useEffect(() => {
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
        const sortedData = (data || []).map((board: any) => {
          if (board.lists) {
            board.lists.sort((a: List, b: List) => a.position - b.position);
            board.lists.forEach((list: any) => {
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
          data.lists.forEach((list: any) => {
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
    // Optimistic update could happen here
    const { error } = await supabase
      .from("cards")
      .update({ list_id: newListId, position: newPosition })
      .eq("id", cardId);

    if (error) toast.error("Failed to move card");
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
    updateCardPosition,
  };
};
