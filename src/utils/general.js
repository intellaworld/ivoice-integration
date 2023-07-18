export const splitAudioBuffer = (audioBuffer, segmentDuration) => {
  const audioContext = new AudioContext();
  const sampleRate = 44100;
  const numChannels = 1;
  const segmentSize = segmentDuration * sampleRate;
  const numSegments = Math.ceil(audioBuffer.duration / segmentDuration);
  const segments = [];
  for (let i = 0; i < numSegments; i++) {
    const start = i * segmentSize;
    const end = Math.min(start + segmentSize, audioBuffer.length);
    const segment = audioContext.createBuffer(
      numChannels,
      segmentSize,
      sampleRate
    );
    for (let j = 0; j < numChannels; j++) {
      const channelData = audioBuffer.getChannelData(j);
      const segmentChannelData = segment.getChannelData(j);
      segmentChannelData.set(channelData.subarray(start, end));
    }
    segments.push(segment);
  }
  return segments;
};

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
