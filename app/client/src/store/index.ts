import { configureStore } from "@reduxjs/toolkit";
import globalSlice from "./globalSlice";
import authSlice from "./authSlice";
import roomSlice from "./roomSlice";

export const store = configureStore({
  reducer: {
    global: globalSlice,
    auth: authSlice,
    room: roomSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
