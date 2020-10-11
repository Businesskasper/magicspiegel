import * as Services from "./Services/export";
import { ipcRenderer } from "electron";
import { env } from "face-api.js";
import * as fs from "fs";
import * as readline from "readline";

let dataAdapter = new Services.DataAdapter("./magicspiegel.db"); // Is our interface to the database
let faceRecognitionService  = new Services.FaceRecognitionService(dataAdapter); // Is a wrapper for faceapi.js and manages users
let mirrorService = new Services.MirrorService(dataAdapter); // Presents our widgets


// This gets triggered from the frontend webservice - when the user updates the widget settings, we need to reload the profile
ipcRenderer.on('WidgetSettingsUpdated', (event, args) => {

    console.log(`WidgetSettingsUpdated was received from ipcMain for user ${args}`)
    if (args === "PUBLIC") {

        mirrorService.LoadGeneralWidgets();
    }
    else {

        mirrorService.currentUser = null;
    }
})

// Gets invoked when a person is detected and recognized
faceRecognitionService.onPersonDetectedEvent.subscribe((sender: Services.FaceRecognitionService, personDetectedIdentifier: string) => {
    
    console.log(`Event displatched: ${personDetectedIdentifier}`);
    mirrorService.SetCurrentUser(personDetectedIdentifier);
});


try {

    // Set up secrets for debugging, mainly private api keys
    setEnvironment('./secrets.env');

    // Create the database
    dataAdapter.InitializeDatabase("./db.txt");
    
    // Load installed widgets
    mirrorService.RegisterWidgets();

    // Initialize faceapi.js
    faceRecognitionService.SetupService().then(() => {

        // Load webcam
        faceRecognitionService.InitializeCamera(512,512).then(() => {

            // Start the app :)
            faceRecognitionService.DetectFaces();
        })
    })

}
catch (err) {

    console.error(err);
    throw(err);
}



// Sets up environment variables
function setEnvironment(envFilePath: string): void {

    fs.readFileSync(envFilePath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {

        console.log(`Setting variable ${line.split('=')[0]}`)
        process.env[line.split('=')[0]] = line.split('=')[1];
    });


    // let lineReader = readline.createInterface({
    //     input: fs.createReadStream(envFilePath)
    // });

    // lineReader.on('line', (line) => {

    //     if (! line.includes('='))
    //         return;
        
    //     console.log(`Setting variable ${line.split('=')[0]}`)
    //     process.env[line.split('=')[0]] = line.split('=')[1];
    // })
}