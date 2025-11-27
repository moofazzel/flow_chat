import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Label {
  id: string;
  name: string;
  color: string;
  textColor: string;
  boardId: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardData {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  labels?: Label[];
  serverId?: string;
}

interface BoardState {
  boards: BoardData[];
  activeBoard: BoardData | null;
  showLabelManager: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  boards: [],
  activeBoard: null,
  showLabelManager: false,
  isLoading: false,
  error: null,
};

const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    setBoards: (state, action: PayloadAction<BoardData[]>) => {
      state.boards = action.payload;
    },
    addBoard: (state, action: PayloadAction<BoardData>) => {
      state.boards.push(action.payload);
    },
    updateBoard: (state, action: PayloadAction<BoardData>) => {
      const index = state.boards.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.boards[index] = action.payload;
      }
    },
    deleteBoard: (state, action: PayloadAction<string>) => {
      state.boards = state.boards.filter((b) => b.id !== action.payload);
    },
    setActiveBoard: (state, action: PayloadAction<BoardData | null>) => {
      state.activeBoard = action.payload;
    },
    addLabel: (
      state,
      action: PayloadAction<{ boardId: string; label: Label }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      if (board) {
        if (!board.labels) {
          board.labels = [];
        }
        board.labels.push(action.payload.label);
      }
    },
    updateLabel: (
      state,
      action: PayloadAction<{
        boardId: string;
        labelId: string;
        name: string;
        color: string;
      }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      if (board && board.labels) {
        const label = board.labels.find((l) => l.id === action.payload.labelId);
        if (label) {
          label.name = action.payload.name;
          label.color = action.payload.color;
        }
      }
    },
    deleteLabel: (
      state,
      action: PayloadAction<{ boardId: string; labelId: string }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      if (board && board.labels) {
        board.labels = board.labels.filter(
          (l) => l.id !== action.payload.labelId
        );
      }
    },
    setShowLabelManager: (state, action: PayloadAction<boolean>) => {
      state.showLabelManager = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setBoards,
  addBoard,
  updateBoard,
  deleteBoard,
  setActiveBoard,
  addLabel,
  updateLabel,
  deleteLabel,
  setShowLabelManager,
  setLoading,
  setError,
} = boardSlice.actions;

export default boardSlice.reducer;
