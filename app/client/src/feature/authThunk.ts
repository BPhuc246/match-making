import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios";
import type {
  LoginInput,
  RegisterInput,
  UserInfo,
} from "../types/userInterface";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export const fetch = createAsyncThunk<UserInfo, void>(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/auth/me");
      return res.data.result;
    } catch (_) {
      return rejectWithValue(null);
    }
  },
);

export const register = createAsyncThunk<
  UserInfo,
  RegisterInput,
  { rejectValue: string }
>("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/auth/register", data);
    toast.success("Register successfully");
    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Register failed");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});

export const login = createAsyncThunk<
  UserInfo,
  LoginInput,
  { rejectValue: string }
>("auth/login", async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/auth/login", data);
    toast.success("Login successfully");
    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Login failed");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/logout");
      toast.success("Logout successfully");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data || "Logout failed");
        return rejectWithValue(error.response?.data || "Error");
      }

      toast.error("Unknown error");
      return rejectWithValue("Unknown error");
    }
  },
);
