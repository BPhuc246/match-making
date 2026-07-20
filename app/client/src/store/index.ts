import { configureStore } from "@reduxjs/toolkit";
import globalSlice from "./globalSlice";
import authSlice from "./authSlice";
import queueSlice from "./queueSlice";
import matchSlice from "./matchSlice";
import adminSlice from "./adminSlice";

export const store = configureStore({
  reducer: {
    global: globalSlice,
    auth: authSlice,
    match: matchSlice,
    queue: queueSlice,
    admin: adminSlice
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
