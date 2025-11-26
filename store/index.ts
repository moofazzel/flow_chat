import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import callReducer from "./slices/callSlice";
import chatReducer from "./slices/chatSlice";
import serverReducer from "./slices/serverSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    call: callReducer,
    auth: authReducer,
    ui: uiReducer,
    server: serverReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["call/receiveCall", "call/startCall"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.offer", "payload.incomingOffer"],
        // Ignore these paths in the state
        ignoredPaths: ["call.incomingOffer"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
