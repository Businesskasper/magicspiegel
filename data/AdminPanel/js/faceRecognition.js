async function SetupService(faceapi) {
  const detectionNet = faceapi.nets.ssdMobilenetv1;
  await detectionNet.load("src/data/weights"),
    await faceapi.nets.faceLandmark68Net.load(
      "src/data/models/face_landmark_68"
    );
  await faceapi.nets.faceRecognitionNet.load(
    "src/data/models/face_recognition"
  );
}

// Detect the face from the provided photo for user registration
async function DetectSingleFace(faceapi, source) {
  const singleResult = await faceapi
    .detectSingleFace(
      source,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  console.log(`Detected ${singleResult.descriptor}`);
  return singleResult?.descriptor;
}

// We need to "start up" faceapi.js by detecting some face.
async function InitializeDetection(faceapi, initMedia) {
  await DetectSingleFace(faceapi, initMedia);
}
