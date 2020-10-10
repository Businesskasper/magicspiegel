async function SetupService(faceapi) {

    try {
        console.log('SetupService()');
        let detectionNet = faceapi.nets.ssdMobilenetv1;
        await detectionNet.load('src/data/weights'), 
        await faceapi.nets.faceLandmark68Net.load('src/data/models/face_landmark_68')
        await faceapi.nets.faceRecognitionNet.load('src/data/models/face_recognition')
    }
    catch (err) {

        console.log(err);
    }
}

// Detect the face from the provided photo for user registration. The user will be stored in the database.
async function DetectSingleFace(faceapi, source) {

    console.log("FaceRecognitionService.DetectFaces() -> Detecting..");

    let singleResult = await faceapi.detectSingleFace(source, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 })).withFaceLandmarks().withFaceDescriptor();

    console.log(`FaceRecognitionService.DetectFaces() -> Detected ${singleResult.descriptor}`);
    if (typeof singleResult !== 'undefined') {

        return singleResult.descriptor;
    }
}

// We need to "start up" faceapi.js by detecting some face.
async function InitializeDetection(faceapi, initMedia) {

    console.log('InitializeDetection()');
    await DetectSingleFace(faceapi, initMedia);
}