import React from "react";
import { AudioOutlined, CheckSquareFilled } from "@ant-design/icons";
import { Button, Input, Layout, Space, Typography, theme } from "antd";
import toWav from "audiobuffer-to-wav";
import Head from "next/head";
import { getSocket, convertBlobToBase64 } from "../socket";

const { Header, Content } = Layout;

export default function Home() {
  const [apiToken, setApiToken] = React.useState("MraWy8nWYUaYBRmmetAbVA==");
  const [accountId, setAccountId] = React.useState(
    "4ed2a455-3618-4beb-8af2-25895780a8ac"
  );
  const [isAudioRecording, setIsAudioRecording] = React.useState(false);
  const [transcriptionText, setTranscriptionText] = React.useState("");

  let socket = React.useRef(null);
  let recordingId = React.useRef("");
  let recordTimerId = React.useRef(null);
  let recordStream = React.useRef(null);
  let messages = React.useRef("");

  const {
    token: { colorTextLightSolid, colorWhite },
  } = theme.useToken();

  async function recordAudio() {
    try {
      setIsAudioRecording(true);

      // messages.current = "";

      recordStream.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, channelCount: 1 },
      });

      const mediaRecorder = new MediaRecorder(recordStream.current);
      const chunks = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", async () => {
        const blob = new Blob(chunks);

        const audioData = await blob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        const wavData = toWav(audioBuffer);

        const wavBlob = new Blob([wavData], { type: "audio/wav" });
        const base64data = await convertBlobToBase64(wavBlob);

        if (recordingId?.current) {
          const msg = JSON.stringify({
            recordingId: recordingId?.current,
            data: base64data,
          });

          socket?.current?.emit("recording-chunk", msg);
        }
      });

      mediaRecorder.start();

      recordTimerId.current = setTimeout(() => {
        mediaRecorder.stop();
        recordAudio();
      }, 3000);
    } catch (error) {
      console.error("Error", error);
      setIsAudioRecording(false);
    }
  }

  function stopAudioRecord() {
    if (recordTimerId.current) {
      endCall();
      clearTimeout(recordTimerId.current);
      setIsAudioRecording(false);
    }
    recordStream?.current?.getTracks()?.forEach((track) => track.stop());
  }

  function startRecording(cb) {
    if (!socket?.current && apiToken) {
      socket.current = getSocket(accountId, apiToken);

      socket.current.on("recording-started", (msg) => {
        recordingId.current = JSON.parse(msg)?.recordingId;
      });

      socket.current.on("connect", () => {
        console.log("Connected to the backend socket");
      });

      socket.current.on("connect_error", (e) => {
        alert(JSON.stringify(e));
      });

      socket.current.on("error", (e) => {
        alert(e);
      });

      socket.current.on("chunk-result", (message) => {
        messages.current += message === "" ? "😀" : JSON.parse(message).data;
        setTranscriptionText(messages.current);
      });

      socket.current.on("recording-stopped", () => {
        console.log("recording-stopped");
      });

      socket.current.on("disconnect", () => {
        console.log("Disconnected");
      });
    }

    socket.current.emit(
      "start-recording",
      JSON.stringify({ api_token: apiToken, accountId: accountId })
    );
    cb();
  }

  function endCall() {
    if (recordingId?.current) {
      const msg = JSON.stringify({
        api_token: apiToken,
        accountId: accountId,
        recordingId: recordingId?.current,
      });

      socket?.current?.emit("stop-recording", msg);
      recordingId.current = "";
    }

    setIsAudioRecording(false);
  }

  React.useEffect(() => {
    console.log(recordingId.current);
  }, [recordingId.current]);

  return (
    <>
      <Head>
        <title>Realtime Transcription</title>
      </Head>
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography.Text
            style={{
              color: colorTextLightSolid,
            }}
          >
            Realtime Transcription
          </Typography.Text>
        </Header>
        <Content
          className="site-layout"
          style={{
            padding: "25px 50px",
            // height: "calc(100vh - 132px)"
            // height: "100%",
          }}
        >
          <Space style={{ width: "100%", marginBottom: 10 }}>
            <Input
              addonBefore="Account Id"
              onChange={(e) => setAccountId(e.target.value)}
              value={accountId}
            />
            <Input
              addonBefore="Api Token"
              onChange={(e) => setApiToken(e.target.value)}
              value={apiToken}
            />
          </Space>
          <Space style={{ display: "block", marginBottom: 20 }}>
            <Typography.Text>
              Fill User ID and User Token fields to start transcription
            </Typography.Text>
          </Space>
          <Space direction="vertical">
            {isAudioRecording ? (
              <Button
                style={{ width: 150 }}
                danger
                type="primary"
                icon={<CheckSquareFilled />}
                onClick={stopAudioRecord}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                style={{ width: 150 }}
                type="primary"
                icon={<AudioOutlined />}
                disabled={!apiToken || !accountId}
                onClick={() => startRecording(recordAudio)}
              >
                Start Recording
              </Button>
            )}
          </Space>
          <div
            dir={transcriptionText ? "rtl" : "ltr"}
            style={{
              marginTop: 24,
              lineHeight: 2.5,
              padding: 24,
              // height: 300,
              background: "black",
              overflowY: "scroll",
            }}
          >
            {transcriptionText ? (
              <span style={{ color: colorWhite }}>{transcriptionText}</span>
            ) : (
              <span style={{ color: colorWhite, userSelect: "none" }}>
                Start recording or send file for transcription to start
                appearing here
              </span>
            )}
          </div>
        </Content>
        {/* <Footer style={{ textAlign: "center" }}>intella</Footer> */}
      </Layout>
    </>
  );
}
