import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file" | "video";
  url?: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  isCurrentUser?: boolean;
  channelId: string;
  mentions?: string[];
  attachments?: Attachment[];
  // Add other fields as needed
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setMessages, addMessage, setLoading, setError } =
  chatSlice.actions;
export default chatSlice.reducer;
