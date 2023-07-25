# Integration Guide: Integrating with ENBD as a Third Party

Thank you for choosing to integrate your software with ours. This guide will provide the necessary steps to establish communication via socket and send recording calls to get real-time transcription detecting flagging keywords. Then you can see calls insights, agents' performance, and clients' satisfaction. Please follow the instructions below for successful integration:

## Step 1: Establishing a connection

To initiate communication with our software, you need to establish a socket connection. Use the following steps:

1. Open a socket connection to the specified host and port.
2. Provide the authentication data to get permitted to establish a connection

- provide the `AgentId` associated with your agent that will make the call.
- provide the `ApiToken` corresponding to the specific project you want the call to be associated with.

`Make sure to include these details in the headers as part of the initial communication to set the call in the desired project under the specific agent.`

```js
import io from "socket.io-client";

const userId = "xxxxxxxx-xxxx-xxxx-xxxxx-xxxxxxx"; // AgentId
const token = "YOU_API_TOKEN_ASSOCIATED_WITH_PROJECT"; // ApiToken
const uri = "wss://xx.xxx.xx.xxx:xxxx"; // wss://host:port

io(uri, {
  "/client-side-socket",
  transports: ["websocket"],
  auth: { userId, token },
});
```

## Step 2: Sending recording calls

To send a recording call, please note the following considerations:

1. We accept a `wav` file readable by browser e.g. `Google Chrome`
2. You can also record calls using browser `mic`
3. If the file is larger than 2.5 seconds, it should be divided into chunks of 2.5-second duration
4. Each chunk should be sent as separated `base64` encoded blob(file) over the socket connection
5. Ensure that the chunks are sent sequentially and in the correct order to maintain the continuity of the audio stream
6. Ensure to emit chunks with `message` key

```js
const wavBlob = new Blob([wavData], { type: "audio/wav" });
const base64data = await convertBlobToBase64(wavBlob); // convert file to base64
const messageBody = JSON.stringify({
  data: base64data,
  id: "AGENT_ID",
});

socket.emit("message", messageBody);
```

## Step 3: Closing the connection

After the call ends, it is important to close the socket connection gracefully. Use the following steps to close the connection:

1. Emit a specific signal `end-call` to indicate the end of the call.
2. Wait for any pending data to be processed or acknowledged.
3. Close the socket connection.

```js
socket.emit(
  "end-call",
  JSON.stringify({
    id: "AGENT_ID",
  })
); // signal that agent has ended the call
socket.on("end-call", () => {
  // listen for call-ended ack
  socket.disconnect(); // disconnect the socket
});
```
