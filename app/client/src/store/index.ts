import { configureStore } from "@reduxjs/toolkit";
import globalSlice from "./globalSlice";
import authSlice from "./authSlice";
// import roomSlice from "./roomSlice";
import queueSlice from "./queueSlice";

export const store = configureStore({
  reducer: {
    global: globalSlice,
    auth: authSlice,
    // room: roomSlice,
    queue: queueSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
