import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uireducer";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;