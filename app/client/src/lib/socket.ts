import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;
let matchSubscription: { unsubscribe: () => void } | null = null;

export function connectSocket(onMatched: (payload: any) => void) {
  if (client?.active) return client;

  client = new Client({
    webSocketFactory: () =>
      new SockJS("http://localhost:8000/api/ws", null, { transports: ["websocket"] }),
    reconnectDelay: 3000,
    onConnect: () => {
      client!.subscribe("/user/queue/match", (message) => {
        onMatched(JSON.parse(message.body));
      });
    },
  });

  client.activate();
  return client;
}

export function subscribeToMatch(matchId: string, onUpdate: (payload: any) => void) {
  if (!client?.active) return;
  matchSubscription?.unsubscribe();
  matchSubscription = client.subscribe(`/topic/match/${matchId}`, (message) => {
    onUpdate(JSON.parse(message.body));
  });
}

export function unsubscribeFromMatch() {
  matchSubscription?.unsubscribe();
  matchSubscription = null;
}

export function disconnectSocket() {
  matchSubscription?.unsubscribe();
  matchSubscription = null;
  client?.deactivate();
  client = null;
}