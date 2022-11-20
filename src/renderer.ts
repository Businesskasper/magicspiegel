import { ipcRenderer } from 'electron';
import * as fs from "fs";
import * as Events from "./Events";
import * as Services from "./Services";

// Setup services

const logger = new Services.LoggingService(console.log);

// Database interface
const dataAdapter = new Services.DataAdapter(logger, "./magicspiegel.db");

// Wrapper for faceapi.js and user management
const recognitionService = new Services.RecognitionService(dataAdapter, logger);

// Presentation and widget management
const mirrorService = new Services.MirrorService(dataAdapter, logger);


// Setup app events

// Gets invoked when a person is detected and recognized
recognitionService.onUserDetected.subscribe(
  (sender: Services.RecognitionService, user: Events.UserDetected) => {
    mirrorService.SetCurrentUser(user.userName);
  }
);

// Gets invoked when a user profile was updated from the admin panel
ipcRenderer.on(Events.UserUpdatedToken, (event, { userName }: Events.UserUpdated) => {
  logger.Info(Events.UserUpdatedToken + ' received: ' + userName);
  const currentUserName = mirrorService.currentUser?.userLoaded?.name;
  if (userName === "PUBLIC" && currentUserName !== "PUBLIC" && currentUserName !== "") {
    logger.Info("Invoking LoadGeneralWidgets()")
    mirrorService.LoadGeneralWidgets();
  }
  else {
    logger.Info("Resetting currentUser")
    // mirrorService.currentUser === null
    // else mirrorService.refreshCurrentUser();
    mirrorService.setNewCurrentUser({ ...mirrorService.currentUser });
  };
})

// Initialize app

try {
  // Set up secrets for debugging, mainly private api keys
  setEnvironment("./secrets.env");

  // Create the database
  dataAdapter.InitializeDatabase("./db.txt");

  // Load installed widgets
  mirrorService.RegisterWidgets();

  recognitionService
    // Initialize faceapi.js
    .InitializeDetection()
    // Initialize camera
    .then((service) => service.InitializeCamera(800, 800))
    // Start detecting
    .then((service) => service.DetectFaces());
} catch (err) {
  logger.Error(err);
  throw err;
}

// Sets up environment variables
function setEnvironment(envFilePath: string): void {
  fs.readFileSync(envFilePath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      console.log(`Setting variable ${line.split("=")[0]}`);
      process.env[line.split("=")[0]] = line.split("=")[1];
    });
}
