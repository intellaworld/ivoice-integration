import styles from "../styles/Home.module.css";
import { closeSocket, getSocket } from "../socket";
import toWav from "audiobuffer-to-wav";

import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  let socket = null;
  const henksh = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, channelCount: 1 },
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      // Handle data available
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      // Handle stop recording
      mediaRecorder.addEventListener("stop", async () => {
        // Convert chunks to a Blob
        const blob = new Blob(chunks);

        // Convert the audio data to WAV format
        const audioData = await blob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        const wavData = toWav(audioBuffer);

        const wavBlob = new Blob([wavData], { type: "audio/wav" });
        const base64data = await convertBlobToBase64(wavBlob);

        var json = JSON.stringify({
          data: base64data,
          email: "youssef@gmail.com",
        });
        if (socket) {
          socket.emit("message", json);
        }

        const audio = new Audio();
        audio.src = "data:audio/wav;base64," + base64data;
        console.log("playing");
        audio.play();
      });

      // Start recording for 2.5 seconds
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 2500);
    } catch (error) {
      console.error("Error accessing microphone", error);
    }
  };

  const convertBlobToBase64 = (blob) => {
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

  const handleDisconnect = () => {
    console.log("handledisconnect");
    const email = "youssef@gmail.com";
    const json = JSON.stringify({ email });
    if (socket) {
      socket.emit("end-call", json);
      console.log("end-call emitted");
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => {
          let _socket = getSocket();
          socket = _socket;

          socket.on("connect", () => {
            console.log("Connected to the backend socket");
          });

          socket.on("message", (message) => {
            console.log(message);
          });

          socket.on("done", () => {
            console.log("done");
            socket.disconnect();
          });

          socket.on("disconnect", handleDisconnect);

          henksh();
          const id = setInterval(() => {
            henksh();
          }, 2500);
        }}
      >
        Start call
      </button>
      <button
        onClick={() => {
          console.log("disconnect");
          handleDisconnect();
        }}
      >
        End call
      </button>
    </div>
  );
}
