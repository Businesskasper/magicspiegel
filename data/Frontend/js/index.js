//Event - webcam is ready to use
var mediaReadyEvent = document.createEvent('Event');
mediaReadyEvent.initEvent('mediaReady', true, true);
window.addEventListener('mediaReady', () => {

    //Show Submit Button on RegisterUserForm
    ActivateSubmitButton();
}, false)

//face-api.js for face recognition
const fapi = faceapi;


//To Submit
var userWidgets = [];
var selectedUserName = '';

//Init Page
LoadIndexPage();

//Setup facerecognition
SetupService(fapi).then(() => {

    InitializeMedia().then(() => {

        InitializeDetection(fapi, document.getElementById('initImg'));
    })   
}).catch((err) => {
    
    console.log('failed');
})
