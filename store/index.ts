import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer from "./slices/authSlice";
import boardReducer from "./slices/boardSlice";
import callReducer from "./slices/callSlice";
import chatReducer from "./slices/chatSlice";
import serverReducer from "./slices/serverSlice";
import taskReducer from "./slices/taskSlice";
import uiReducer from "./slices/uiSlice";

// Create a noop storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use web storage on client, noop storage on server
const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

// Combine all reducers
const rootReducer = combineReducers({
  call: callReducer,
  auth: authReducer,
  ui: uiReducer,
  server: serverReducer,
  chat: chatReducer,
  task: taskReducer,
  board: boardReducer,
});

// Configure which slices to persist
const persistConfig = {
  key: "flow-chat-root",
  storage,
  whitelist: ["auth", "ui", "server", "task", "board"], // Persist these slices
  blacklist: ["call", "chat"], // Don't persist call and chat (real-time data)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for redux-persist
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          "call/receiveCall",
          "call/startCall",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          "payload.offer",
          "payload.incomingOffer",
          "register",
          "rehydrate",
        ],
        // Ignore these paths in the state
        ignoredPaths: ["call.incomingOffer", "register", "rehydrate"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
