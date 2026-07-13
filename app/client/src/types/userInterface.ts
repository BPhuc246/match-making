export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string;
  rank: string;
  score: number;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthInitialState {
  user: UserInfo | null;
  status: "idle" | "rejected" | "succeeded" | "pending";
  error: string | null,
}