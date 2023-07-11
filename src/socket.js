import io from "socket.io-client";

export const getSocket = () => {
  return io("ws://20.171.100.143:7000", {
    path: "/client-side-socket",
    transports: ["websocket"],
    auth: {
      token: "aaaaaaaaaaaasssssddddd",
      userId: "b6e63fac-368a-4206-b7c7-24bf2a0e9f74",
    },
  });
};

export const closeSocket = (socket) => {
  socket.disconnect();
};
