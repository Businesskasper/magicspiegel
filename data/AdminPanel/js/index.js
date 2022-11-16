//Event - webcam is ready to use
var mediaReadyEvent = document.createEvent("Event");
mediaReadyEvent.initEvent("mediaReady", true, true);
window.addEventListener(
  "mediaReady",
  () => {
    //Show Submit Button on RegisterUserForm
    ActivateSubmitButton();
  },
  false
);

//To Submit
var userWidgets = [];
var selectedUserName = "";

//Init Page
LoadIndexPage();

//Setup facerecognition
//face-api.js for face recognition
const fapi = faceapi;
SetupService(fapi).then(() => {
  console.log('Service is set up')
})
// SetupService(fapi)
//   .then(() => InitializeDetection(fapi, document.getElementById("initImg")))
//   .catch((err) => {
//     console.log("faceapi setup failed", err);
//   });
