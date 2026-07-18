import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { QueueJoinResponse } from "../types/queueInterface";
import type { MatchStateResponse } from "../types/matchInterface";

let client: Client | null = null;
let matchmakingCallback: ((payload: QueueJoinResponse) => void) | null = null;
let roundCallback: ((payload: MatchStateResponse) => void) | null = null;
let matchSub: { unsubscribe: () => void } | null = null;
let roundSub: { unsubscribe: () => void } | null = null;

function resubscribeAll() {
  if (!client?.connected) return;

  if (matchmakingCallback) {
    matchSub?.unsubscribe();
    matchSub = client.subscribe("/user/queue/match", (msg) => {
      matchmakingCallback!(JSON.parse(msg.body));
    });
  }
  if (roundCallback) {
    roundSub?.unsubscribe();
    roundSub = client.subscribe("/user/queue/round", (msg) => {
      roundCallback!(JSON.parse(msg.body));
    });
  }
}

function ensureConnected() {
  if (client?.active) {
    resubscribeAll();
    return;
  }

  client = new Client({
    webSocketFactory: () =>
      new SockJS("http://localhost:8000/api/ws", null, { transports: ["websocket"] }),
    reconnectDelay: 3000,
    onConnect: resubscribeAll,
  });

  client.activate();
}

export function connectSocket(onMatched: (payload: QueueJoinResponse) => void) {
  matchmakingCallback = onMatched;
  ensureConnected();
}

export function unsubscribeFromMatchmaking() {
  matchSub?.unsubscribe();
  matchSub = null;
  matchmakingCallback = null;
}

export function subscribeToRoundUpdates(onUpdate: (payload: MatchStateResponse) => void) {
  roundCallback = onUpdate;
  ensureConnected(); 
}

export function unsubscribeFromRoundUpdates() {
  roundSub?.unsubscribe();
  roundSub = null;
  roundCallback = null;
}

export function disconnectSocket() {
  matchSub?.unsubscribe();
  roundSub?.unsubscribe();
  matchSub = null;
  roundSub = null;
  matchmakingCallback = null;
  roundCallback = null;
  client?.deactivate();
  client = null;
}