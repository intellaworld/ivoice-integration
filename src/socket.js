import io from "socket.io-client";

const SOCKET_URI = process.env.NEXT_PUBLIC_SOCKET_URI;

export const getSocket = (
  userId,
  token,
  uri = "ws://20.171.100.143:7000",
  path = "/client-side-socket"
) =>
  io(SOCKET_URI ? `ws://${SOCKET_URI}` : uri, {
    path,
    transports: ["websocket"],
    auth: { userId, token },
  });
