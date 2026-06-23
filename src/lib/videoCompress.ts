"use client";

let ffmpegInstance: any = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");
  const ffmpeg = new FFmpeg();
  const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export async function compressVideo(file: File, maxWidth = 640, maxFps = 15): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const inputName = "input" + (file.name.match(/\.(\w+)$/)?.[0] || ".mp4");
  const outputName = "output.mp4";

  ffmpeg.writeFile(inputName, await fetchFile(file));

  await ffmpeg.exec([
    "-i", inputName,
    "-vf", `scale='min(${maxWidth},iw)':-2,fps=${maxFps}`,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "28",
    "-movflags", "+faststart",
    "-an",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Blob([data], { type: "video/mp4" });
}
