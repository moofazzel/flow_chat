import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ViewType = "chat" | "board" | "dm";

interface UiState {
  currentView: ViewType;
  sidebarCollapsed: boolean;
  floatingChatOpen: boolean;
  showLabelManager: boolean;
}

const initialState: UiState = {
  currentView: "chat",
  sidebarCollapsed: false,
  floatingChatOpen: false,
  showLabelManager: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<ViewType>) => {
      state.currentView = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setFloatingChatOpen: (state, action: PayloadAction<boolean>) => {
      state.floatingChatOpen = action.payload;
    },
    toggleFloatingChat: (state) => {
      state.floatingChatOpen = !state.floatingChatOpen;
    },
    setShowLabelManager: (state, action: PayloadAction<boolean>) => {
      state.showLabelManager = action.payload;
    },
  },
});

export const {
  setCurrentView,
  setSidebarCollapsed,
  toggleSidebar,
  setFloatingChatOpen,
  toggleFloatingChat,
  setShowLabelManager,
} = uiSlice.actions;

export default uiSlice.reducer;
