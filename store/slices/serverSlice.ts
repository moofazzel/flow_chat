import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  category: string;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
  categories: string[];
}

interface ServerState {
  servers: Server[];
  currentServerId: string | null;
  selectedChannelId: string;
  channels: Channel[]; // Channels of the current server
  categories: string[]; // Categories of the current server
}

const initialState: ServerState = {
  servers: [], // We'll populate this from API/storage later
  currentServerId: null,
  selectedChannelId: "general",
  channels: [],
  categories: [],
};

const serverSlice = createSlice({
  name: "server",
  initialState,
  reducers: {
    setServers: (state, action: PayloadAction<Server[]>) => {
      state.servers = action.payload;
    },
    setCurrentServerId: (state, action: PayloadAction<string | null>) => {
      state.currentServerId = action.payload;
      // When server changes, we should update channels/categories
      // This logic might move to a thunk or effect later
      if (action.payload) {
        const server = state.servers.find((s) => s.id === action.payload);
        if (server) {
          state.channels = server.channels;
          state.categories = server.categories;
          // Reset channel to first one if available
          if (server.channels.length > 0) {
            state.selectedChannelId = server.channels[0].id;
          }
        }
      } else {
        state.channels = [];
        state.categories = [];
      }
    },
    setSelectedChannelId: (state, action: PayloadAction<string>) => {
      state.selectedChannelId = action.payload;
    },
    setChannels: (state, action: PayloadAction<Channel[]>) => {
      state.channels = action.payload;
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    addChannel: (state, action: PayloadAction<Channel>) => {
      state.channels.push(action.payload);
      // Also update the server object in the list
      if (state.currentServerId) {
        const server = state.servers.find(
          (s) => s.id === state.currentServerId
        );
        if (server) {
          server.channels.push(action.payload);
        }
      }
    },
  },
});

export const {
  setServers,
  setCurrentServerId,
  setSelectedChannelId,
  setChannels,
  setCategories,
  addChannel,
} = serverSlice.actions;

export default serverSlice.reducer;
