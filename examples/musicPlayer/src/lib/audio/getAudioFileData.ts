export async function getAudioFileData(file: Blob, samples = 200) {
  const ctx = new AudioContext();

  const buffer = await file.arrayBuffer();
  const decodedAudio = await ctx.decodeAudioData(buffer);

  return {
    waveform: transformDecodedAudioToWaweformData(decodedAudio, samples),
    duration: decodedAudio.duration,
  };
}

const transformDecodedAudioToWaweformData = (
  audioBuffer: AudioBuffer,
  samples: number
) => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision

  const sampledData: number[] = new Array(samples);
  let max = 0;

  for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    const sampledValue = sum / blockSize; // divide the sum by the block size to get the average

    if (max < sampledValue) {
      max = sampledValue;
    }

    sampledData[i] = sampledValue;
  }

  const multiplier = max ** -1;

  for (let i = 0; i < samples; i++) {
    sampledData[i] = sampledData[i] * multiplier;
  }

  return sampledData;
};
