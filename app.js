const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1350;

const overlays = [
  { name: "Frame 1", src: "overlays/one.png" },
  { name: "Frame 2", src: "overlays/two.png" },
  { name: "Frame 3", src: "overlays/three.png" },
];

const video = document.querySelector("#camera");
const liveOverlay = document.querySelector("#liveOverlay");
const cameraStage = document.querySelector("#cameraStage");
const cameraMessage = document.querySelector("#cameraMessage");
const cameraMessageText = document.querySelector("#cameraMessageText");
const retryCameraButton = document.querySelector("#retryCameraButton");
const switchCameraButton = document.querySelector("#switchCameraButton");
const captureButton = document.querySelector("#captureButton");
const previousOverlayButton = document.querySelector("#previousOverlayButton");
const nextOverlayButton = document.querySelector("#nextOverlayButton");
const overlayPicker = document.querySelector("#overlayPicker");
const overlayName = document.querySelector("#overlayName");
const overlayPosition = document.querySelector("#overlayPosition");
const canvas = document.querySelector("#outputCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

const resultDialog = document.querySelector("#resultDialog");
const resultImage = document.querySelector("#resultImage");
const closeResultButton = document.querySelector("#closeResultButton");
const retakeButton = document.querySelector("#retakeButton");
const downloadButton = document.querySelector("#downloadButton");
const shareButton = document.querySelector("#shareButton");
const shareNote = document.querySelector("#shareNote");

let currentStream = null;
let facingMode = "user";
let currentOverlayIndex = 0;
let outputBlob = null;
let outputObjectUrl = null;
let swipeStartX = null;

function showCameraMessage(message) {
  cameraMessageText.textContent = message;
  cameraMessage.hidden = false;
  cameraMessage.setAttribute("aria-hidden", "false");
}

function hideCameraMessage() {
  cameraMessage.hidden = true;
  cameraMessage.setAttribute("aria-hidden", "true");
}

function stopCamera() {
  if (!currentStream) return;
  currentStream.getTracks().forEach((track) => track.stop());
  currentStream = null;
}

async function startCamera() {
  stopCamera();
  hideCameraMessage();
  captureButton.disabled = true;

  if (!navigator.mediaDevices?.getUserMedia) {
    showCameraMessage("This browser does not support live camera access.");
    return;
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 2400 },
      },
    });

    video.srcObject = currentStream;

    // Wait until the browser has attached the stream and knows the video size.
    if (video.readyState < 1) {
      await new Promise((resolve) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
      });
    }

    await video.play();
    video.classList.toggle("environment-camera", facingMode === "environment");

    // Some mobile browsers can briefly leave the previous status layer visible
    // while permission is being granted, so explicitly clear it after playback starts.
    hideCameraMessage();
    captureButton.disabled = false;
  } catch (error) {
    console.error(error);
    const permissionMessage =
      error?.name === "NotAllowedError"
        ? "Camera permission was blocked. Allow camera access in your browser settings, then try again."
        : "The camera could not be opened. Check camera access and try again.";
    showCameraMessage(permissionMessage);
  }
}

function updateOverlay(index) {
  currentOverlayIndex = (index + overlays.length) % overlays.length;
  const overlay = overlays[currentOverlayIndex];
  liveOverlay.src = overlay.src;
  overlayName.textContent = overlay.name;
  overlayPosition.textContent = `${currentOverlayIndex + 1} / ${overlays.length}`;
}

function stepOverlay(direction) {
  updateOverlay(currentOverlayIndex + direction);
}

function getCoverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

async function renderCapturedPhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("The camera is not ready yet.");
  }

  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  ctx.save();
  ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  const crop = getCoverCrop(
    video.videoWidth,
    video.videoHeight,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );

  // Match the mirrored selfie preview in the exported image.
  if (facingMode === "user") {
    ctx.translate(OUTPUT_WIDTH, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    video,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );
  ctx.restore();

  const overlay = await loadImage(overlays[currentOverlayIndex].src);
  ctx.drawImage(overlay, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create the image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.94
    );
  });
}

function updateResultPreview(blob) {
  if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
  outputBlob = blob;
  outputObjectUrl = URL.createObjectURL(blob);
  resultImage.src = outputObjectUrl;
  shareNote.hidden = true;
}

async function capturePhoto() {
  captureButton.disabled = true;

  try {
    const blob = await renderCapturedPhoto();
    updateResultPreview(blob);

    if (typeof resultDialog.showModal === "function") {
      resultDialog.showModal();
    } else {
      resultDialog.setAttribute("open", "");
    }
  } catch (error) {
    console.error(error);
    showCameraMessage(error.message || "The photo could not be created.");
  } finally {
    captureButton.disabled = false;
  }
}

function makeOutputFile() {
  return new File([outputBlob], `photo-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

function downloadPhoto() {
  if (!outputBlob) return;

  const link = document.createElement("a");
  link.href = outputObjectUrl;
  link.download = `photo-${Date.now()}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  shareNote.textContent = "If your browser opens the image instead of saving it, use the browser's Save Image option.";
  shareNote.hidden = false;
}

async function sharePhoto() {
  if (!outputBlob) return;

  const file = makeOutputFile();

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: "My photo",
        text: "Made with the photo frame app",
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error(error);
    }
  }

  shareNote.textContent =
    "Direct file sharing is not supported in this browser. Save the photo, then share it from your Photos/Gallery app.";
  shareNote.hidden = false;
}

function closeResult() {
  if (resultDialog.open && typeof resultDialog.close === "function") {
    resultDialog.close();
  } else {
    resultDialog.removeAttribute("open");
  }
}

switchCameraButton.addEventListener("click", async () => {
  facingMode = facingMode === "user" ? "environment" : "user";
  await startCamera();
});

retryCameraButton.addEventListener("click", startCamera);
captureButton.addEventListener("click", capturePhoto);
previousOverlayButton.addEventListener("click", () => stepOverlay(-1));
nextOverlayButton.addEventListener("click", () => stepOverlay(1));
downloadButton.addEventListener("click", downloadPhoto);
shareButton.addEventListener("click", sharePhoto);
closeResultButton.addEventListener("click", closeResult);
retakeButton.addEventListener("click", closeResult);

overlayPicker.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepOverlay(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepOverlay(1);
  }
});

function beginSwipe(event) {
  swipeStartX = event.changedTouches?.[0]?.clientX ?? event.clientX;
}

function finishSwipe(event) {
  if (swipeStartX === null) return;
  const endX = event.changedTouches?.[0]?.clientX ?? event.clientX;
  const distance = endX - swipeStartX;
  swipeStartX = null;

  if (Math.abs(distance) < 45) return;
  stepOverlay(distance < 0 ? 1 : -1);
}

[cameraStage, overlayPicker].forEach((element) => {
  element.addEventListener("touchstart", beginSwipe, { passive: true });
  element.addEventListener("touchend", finishSwipe, { passive: true });
});

window.addEventListener("pagehide", stopCamera);
window.addEventListener("beforeunload", () => {
  stopCamera();
  if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
});

updateOverlay(0);
startCamera();
