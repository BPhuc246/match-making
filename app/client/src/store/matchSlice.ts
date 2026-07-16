import { createSlice, createAction } from "@reduxjs/toolkit";
import type { MatchSliceState, MatchStateResponse } from "../types/matchInterface";
import { fetchMatch, submitChoice, leaveMatch } from "../feature/matchThunk";

const initialState: MatchSliceState = {
  currentMatch: null,
  status: "idle",
  choiceSubmitting: false,
  error: null,
};

// Fired when a socket push arrives on /topic/match/{matchId}
export const matchStateUpdated = createAction<MatchStateResponse>("match/stateUpdated");

export const matchSlice = createSlice({
  name: "match",
  initialState,
  reducers: {
    clearMatch: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatch.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMatch.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentMatch = action.payload;
      })
      .addCase(fetchMatch.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load match";
      })

      .addCase(submitChoice.pending, (state) => {
        state.choiceSubmitting = true;
      })
      .addCase(submitChoice.fulfilled, (state, action) => {
        state.choiceSubmitting = false;
        state.currentMatch = action.payload;
      })
      .addCase(submitChoice.rejected, (state, action) => {
        state.choiceSubmitting = false;
        state.error = action.payload ?? "Failed to submit choice";
      })

      .addCase(leaveMatch.fulfilled, () => initialState)

      .addCase(matchStateUpdated, (state, action) => {
        state.currentMatch = action.payload;
      });
  },
});

export const { clearMatch } = matchSlice.actions;
export default matchSlice.reducer;