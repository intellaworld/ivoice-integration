import io from "socket.io-client";

const SOCKET_URI = process.env.NEXT_PUBLIC_SOCKET_URI;
const PATH = "/sockets";

export const getSocket = (accountId, apiToken) =>
  io(SOCKET_URI, {
    path: PATH,
    transports: ["websocket"],
    auth: {
      api_token: apiToken,
      accountId: accountId,
    },
  });

export const convertBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result.split(",")[1];
      resolve(base64data);
    };
    reader.onerror = (error) => reject(error);
  });
};
