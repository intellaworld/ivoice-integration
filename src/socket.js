import io from "socket.io-client";

export const getSocket = () => {
  return io("ws://20.171.100.143:7000", {
    path: "/client-side-socket",
    transports: ["websocket"],
    auth: {
      token: "aaaaaaaaaaaasssssddddd",
      userId: "9c7b64af-3010-455f-83da-4d9fd873de86",
    },
  });
};

export const closeSocket = (socket) => {
  socket.disconnect();
};

// export default socket;
