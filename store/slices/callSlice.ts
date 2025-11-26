import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CallState {
  isCallModalOpen: boolean;
  callType: "audio" | "video";
  isInitiator: boolean;
  incomingOffer: RTCSessionDescriptionInit | null;
  activeCallUserId: string | null;
  activeCallUserName: string | null;
  activeCallUserAvatar: string | null;
  activeThreadId: string | null;
}

const initialState: CallState = {
  isCallModalOpen: false,
  callType: "audio",
  isInitiator: false,
  incomingOffer: null,
  activeCallUserId: null,
  activeCallUserName: null,
  activeCallUserAvatar: null,
  activeThreadId: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startCall: (
      state,
      action: PayloadAction<{
        type: "audio" | "video";
        userId: string;
        userName: string;
        userAvatar: string;
        threadId: string;
      }>
    ) => {
      state.isCallModalOpen = true;
      state.callType = action.payload.type;
      state.isInitiator = true;
      state.activeCallUserId = action.payload.userId;
      state.activeCallUserName = action.payload.userName;
      state.activeCallUserAvatar = action.payload.userAvatar;
      state.activeThreadId = action.payload.threadId;
      state.incomingOffer = null;
    },
    receiveCall: (
      state,
      action: PayloadAction<{
        type: "audio" | "video";
        userId: string;
        userName: string;
        userAvatar: string; // We might need to fetch this if not in payload
        threadId: string;
        offer: RTCSessionDescriptionInit;
      }>
    ) => {
      state.isCallModalOpen = true;
      state.callType = action.payload.type;
      state.isInitiator = false;
      state.activeCallUserId = action.payload.userId;
      state.activeCallUserName = action.payload.userName;
      state.activeCallUserAvatar = action.payload.userAvatar;
      state.activeThreadId = action.payload.threadId;
      state.incomingOffer = action.payload.offer;
    },
    endCall: (state) => {
      state.isCallModalOpen = false;
      state.isInitiator = false;
      state.incomingOffer = null;
      state.activeCallUserId = null;
      state.activeCallUserName = null;
      state.activeCallUserAvatar = null;
      state.activeThreadId = null;
    },
    setCallModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isCallModalOpen = action.payload;
    },
  },
});

export const { startCall, receiveCall, endCall, setCallModalOpen } =
  callSlice.actions;
export default callSlice.reducer;
