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
  let socket = null;

  const {
    token: { colorBgContainer, colorTextDisabled, colorTextLightSolid },
  } = theme.useToken();

  const [recordTimerId, setRecordTimerId] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isAudioRecording, setIsAudioRecording] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [transcriptionText, setTranscriptionText] = React.useState("");
  const [socketToDisconnect, setSocketToDisconnect] = React.useState(null);

  const fileUploadProps = {
    onRemove: () => {
      setSelectedFile(null);
    },
    beforeUpload: (file) => {
      setSelectedFile(file);
      return false;
    },
    selectedFile,
  };

  async function recordAudio() {
    let stream;
    try {
      setIsAudioRecording(true);

      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, channelCount: 1 },
      });

      const mediaRecorder = new MediaRecorder(stream);
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

        const json = JSON.stringify({
          data: base64data,
          email: "youssef@gmail.com",
        });

        socket?.emit("message", json);
      });

      mediaRecorder.start();

      const timerId = setTimeout(() => {
        mediaRecorder.stop();
        recordAudio();
      }, 2500);

      setRecordTimerId(timerId);
    } catch (error) {
      console.error("Error", error);
      setIsAudioRecording(false);
    }
  }

  function stopAudioRecord() {
    if (recordTimerId) {
      disconnect();
      clearTimeout(recordTimerId);
      setIsAudioRecording(false);
    }
  }

  async function streamFile() {
    try {
      const reader = new FileReader();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();

      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        Promise.all(
          splitAudioBuffer(audioBuffer, 2).map(async (b) => {
            const base64data = await convertBlobToBase64(
              new Blob([toWav(b)], { type: "audio/wav" })
            );
            return JSON.stringify({
              data: base64data,
              email: "youssef@gmail.com",
            });
          })
        ).then((chunks) => {
          setIsStreaming(true);
          let i = 0;
          const intervalId = setInterval(() => {
            if (i === chunks.length) {
              socketToDisconnect?.disconnect();
              clearInterval(intervalId);
              setIsStreaming(false);
              return;
            }
            socket.emit("message", chunks[i]);
            i++;
          }, 2000);
        });
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error", error);
      setIsStreaming(false);
    }
  }

  function startCall(cb) {
    if (!socket) {
      socket = getSocket();
      setSocketToDisconnect(socket);

      let messages = "";

      socket.on("connect", () => {
        console.log("Connected to the backend socket");
      });

      socket.on("connect_error", (e) => {
        alert(e.message);
      });

      socket.on("message", (message) => {
        messages += message;
        setTranscriptionText(messages);
      });

      socket.on("done", () => {
        console.log("done");
        socket.disconnect();
      });

      socket.on("disconnect", disconnect);
    }

    cb();
  }

  function disconnect() {
    console.log("DISCONNECT FN CALLED!");
    socketToDisconnect?.emit(
      "end-call",
      JSON.stringify({ email: "youssef@gmail.com" })
    );
    setIsStreaming(false);
    setIsAudioRecording(false);
  }

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
          <Space style={{ width: "100%", marginBottom: 20 }}>
            <Input addonBefore="User ID" />
            <Input addonBefore="Token" />
          </Space>
          <Space direction="vertical">
            {isAudioRecording ? (
              <Button
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
                type="primary"
                icon={<AudioOutlined />}
                disabled={selectedFile}
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
              {...fileUploadProps}
              maxCount={1}
              style={{
                "& .ant-upload-list.ant-upload-list-text": {
                  position: "absolute",
                },
              }}
            >
              <Space>
                <Button icon={<UploadOutlined />}>Select File</Button>
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
              padding: 24,
              minHeight: 380,
              background: colorBgContainer,
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
