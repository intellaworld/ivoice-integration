// Create a WebSocket object
const socket = new WebSocket(`ws://localhost:5000/client-side-socket`);

socket.onmessage = function (e) {
  let data = JSON.parse(e.data);
  console.log(data);
};
// When the connection is established
socket.addEventListener("open", (event) => {
  henksh();
  const id = setInterval(() => {
    henksh();
  }, 5000);
});

// When the connection is closed
socket.addEventListener("close", (event) => {
  console.log("Connection closed");
});

// When an error occurs
socket.addEventListener("error", (event) => {
  console.error("WebSocket error", event);
});

function henksh() {
  // Start recording audio
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      // Handle data available
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      // Handle stop recording
      mediaRecorder.addEventListener("stop", () => {
        // Convert chunks to a Blob
        const blob = new Blob(chunks, { type: "audio/wav" });

        var reader = new FileReader();
        let i = 1;
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          var base64data = reader.result.split(",")[1];
          var json = JSON.stringify({ data: base64data, id: "youssef" });
          socket.send(json);

          // create an audio element and set its source to the decoded audio data
          const audio = new Audio();
          audio.src = "data:audio/wav;base64," + base64data;
          audio.play();
        };
      });

      // Start recording for 5 seconds
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 2000);
    })
    .catch((error) => {
      console.error("Error accessing microphone", error);
    });
}
