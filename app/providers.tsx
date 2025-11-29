"use client";

import { persistor, store } from "@/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GlobalCallListener } from "./components/GlobalCallListener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        {/* Global listener for incoming calls when DM chat is not mounted */}
        <GlobalCallListener />
      </PersistGate>
    </Provider>
  );
}
