import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export function connectSocket(onMatched: (payload: any) => void) {
  if (client?.active) return client;

  client = new Client({
    webSocketFactory: () =>
      new SockJS("http://localhost:8000/api/ws", null, {
        transports: ["websocket"],
      }),
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

export function disconnectSocket() {
  client?.deactivate();
  client = null;
}
