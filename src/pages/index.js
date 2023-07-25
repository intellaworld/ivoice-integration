import React from "react";
import {
  AudioOutlined,
  CheckSquareFilled,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Input, Layout, Space, Typography, Upload, theme } from "antd";
import toWav from "audiobuffer-to-wav";
import Head from "next/head";
import { getSocket } from "../socket";
import { convertBlobToBase64, splitAudioBuffer } from "../utils/general";

const { Header, Content, Footer } = Layout;

export default function Home() {
  const [userId, setUserId] = React.useState("");
  const [userToken, setUserToken] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isAudioRecording, setIsAudioRecording] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [transcriptionText, setTranscriptionText] = React.useState("");

  let socket = React.useRef(null);
  let callId = React.useRef("");
  let recordTimerId = React.useRef(null);
  let recordStream = React.useRef(null);
  let messages = React.useRef("");

  const {
    token: { colorBgContainer, colorTextDisabled, colorTextLightSolid },
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

        if (callId?.current) {
          const msg = JSON.stringify({
            data: base64data,
            id: callId?.current,
          });

          socket?.current?.emit("message", msg);
        }
      });

      mediaRecorder.start();

      recordTimerId.current = setTimeout(() => {
        mediaRecorder.stop();
        recordAudio();
      }, 2500);
    } catch (error) {
      console.error("Error", error);
      setIsAudioRecording(false);
    }
  }

  async function streamFile() {
    try {
      setIsStreaming(true);

      messages.current = "";
      setTranscriptionText(messages.current);

      const reader = new FileReader();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();

      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        Promise.all(
          splitAudioBuffer(audioBuffer, 2).map(async (b) => ({
            data: await convertBlobToBase64(
              new Blob([toWav(b)], { type: "audio/wav" })
            ),
          }))
        ).then((chunks) => {
          let i = 0;
          const intervalId = setInterval(() => {
            if (i === chunks.length) {
              endCall();
              clearInterval(intervalId);
              setIsStreaming(false);
              setSelectedFile(null);
              return;
            }
            if (callId?.current) {
              chunks[i].id = callId?.current;
              socket?.current?.emit("message", JSON.stringify(chunks[i]));
              i++;
            }
          }, 2500);
        });
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error", error);
      setIsStreaming(false);
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

  function startCall(cb) {
    if (!socket?.current && userId) {
      socket.current = getSocket(userId, userToken);

      socket.current.emit("start-call", JSON.stringify({ id: userId }));

      socket.current.on("call-started", (msg) => {
        callId.current = JSON.parse(msg)?.id;
      });

      socket.current.on("connect", () => {
        console.log("Connected to the backend socket");
      });

      socket.current.on("connect_error", (e) => {
        alert(e.message);
      });

      socket.current.on("message", (message) => {
        messages.current += message;
        setTranscriptionText(messages.current);
      });

      socket.current.on("done", () => {
        console.log("Done");
        socket.current.disconnect();
      });

      socket.current.on("disconnect", () => {
        console.log("Disconnected");
      });
    }

    cb();
  }

  function endCall() {
    console.log("Call ended");
    const msg = JSON.stringify({ id: userId });

    socket?.current?.emit("end-call", msg);

    setIsStreaming(false);
    setIsAudioRecording(false);
  }

  React.useEffect(() => {
    console.log(callId.current);
  }, [callId.current]);

  return (
    <>
      <Head>
        <title>Realtime Transcription</title>
      </Head>
      <Layout>
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
          style={{ padding: "25px 50px", height: "calc(100vh - 132px)" }}
        >
          <Space style={{ width: "100%", marginBottom: 10 }}>
            <Input
              addonBefore="User ID"
              onChange={(e) => setUserId(e.target.value)}
              value={userId}
            />
            <Input
              addonBefore="Token"
              onChange={(e) => setUserToken(e.target.value)}
              value={userToken}
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
                disabled={selectedFile}
                onClick={stopAudioRecord}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                style={{ width: 150 }}
                type="primary"
                icon={<AudioOutlined />}
                disabled={selectedFile || !userId || !userToken}
                onClick={() => startCall(recordAudio)}
              >
                Start Recording
              </Button>
            )}
            <Space>
              <Typography.Text type="secondary" style={{ userSelect: "none" }}>
                Or
              </Typography.Text>
            </Space>
            <Upload
              onRemove={() => {
                setSelectedFile(null);
              }}
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false;
              }}
              selectedFile={selectedFile}
              maxCount={1}
              style={{
                "& .ant-upload-list.ant-upload-list-text": {
                  position: "absolute",
                },
              }}
            >
              <Space>
                <Button
                  style={{ width: 150 }}
                  icon={<UploadOutlined />}
                  disabled={isAudioRecording || !userId || !userToken}
                >
                  Select File
                </Button>
              </Space>
            </Upload>
            {selectedFile && (
              <Button
                type="primary"
                disabled={!selectedFile}
                loading={isStreaming}
                onClick={() => startCall(streamFile)}
              >
                {isStreaming ? "Sending" : "Send"}
              </Button>
            )}
          </Space>
          <div
            dir={transcriptionText ? "rtl" : "ltr"}
            style={{
              marginTop: 24,
              lineHeight: 2.5,
              padding: 24,
              height: 300,
              background: colorBgContainer,
              overflowY: "scroll",
            }}
          >
            {transcriptionText ? (
              <span>{transcriptionText}</span>
            ) : (
              <span style={{ color: colorTextDisabled, userSelect: "none" }}>
                Start recording or send file for transcription to start
                appearing here
              </span>
            )}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>intella</Footer>
      </Layout>
    </>
  );
}
