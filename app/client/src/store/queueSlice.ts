import { createSlice } from "@reduxjs/toolkit";
import {
  cancelQueue,
  checkQueueStatus,
  startQueue,
} from "../feature/queueThunk";
import type { QueueState } from "../types/queueInterface";

const initialState: QueueState = {
  isQueuing: false,
  queueMode: null,
  queueType: null,
  queueEntryId: null,
  matchedRoomId: null,
  opponentId: null,
  status: "idle",
  error: null,
};

export const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    resetQueue: () => initialState,
    clearQueueError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // startQueue
      .addCase(startQueue.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.queueMode = action.meta.arg;
      })
      .addCase(startQueue.fulfilled, (state, action) => {
        const { status, queueEntryId, opponentPlayerId, matchId } =
          action.payload;
        state.queueEntryId = queueEntryId;
        if (status === "MATCHED") {
          state.isQueuing = false;
          state.status = "matched";
          state.matchedRoomId = matchId;
          state.opponentId = opponentPlayerId;
        } else {
          state.isQueuing = true;
          state.status = "polling";
        }
      })
      .addCase(startQueue.rejected, (state, action) => {
        state.isQueuing = false;
        state.status = "failed";
        state.error = action.payload ?? "Failed to join queue";
        state.queueMode = null;
      })

      // checkQueueStatus (polling)
      .addCase(checkQueueStatus.fulfilled, (state, action) => {
        const { status, queueEntryId, opponentPlayerId, matchId } =
          action.payload;
        state.queueEntryId = queueEntryId;

        if (status === "MATCHED") {
          state.isQueuing = false;
          state.status = "matched";
          state.matchedRoomId = matchId;
          state.opponentId = opponentPlayerId;
        }
        // still WAITING -> no state change, keep polling
      })
      .addCase(checkQueueStatus.rejected, (state, action) => {
        // Don't kill the queue UI on a transient poll failure; just surface it
        state.error = action.payload ?? "Failed to check queue status";
      })

      // cancelQueue
      .addCase(cancelQueue.pending, (state) => {
        state.status = "loading";
      })
      .addCase(cancelQueue.fulfilled, () => initialState)
      .addCase(cancelQueue.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to cancel queue";
      });
  },
});

export const { resetQueue, clearQueueError } = queueSlice.actions;
export default queueSlice.reducer;
