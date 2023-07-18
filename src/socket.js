import io from "socket.io-client";

export const getSocket = () => {
  return io("ws://20.171.100.143:7000", {
    path: "/client-side-socket",
    transports: ["websocket"],
    auth: {
      token: "3c10cb533fd535a85ddaacafaf4eaee82ed6ce1c3dfec0ecf0663f99e703a3af",
      userId: "585ffb6b-1e0c-4e36-b95b-098dabf125fb",
    },
  });
};

export const closeSocket = (socket) => {
  socket.disconnect();
};
