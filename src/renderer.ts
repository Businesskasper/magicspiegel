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

// Admin frontend and api
const adminService = new Services.AdminService(dataAdapter, logger);

// Setup app events

// Gets invoked when a person is detected and recognized
recognitionService.onUserDetected.subscribe(
  (sender: Services.RecognitionService, user: Events.UserDetected) => {
    mirrorService.SetCurrentUser(user.userName);
  }
);

// Gets invoked when a user profile was updated from the admin panel
adminService.onWidgetSettingsUpdatedEvent.subscribe(
  (sender: Services.AdminService, user: Events.UserUpdated) => {
    if (user.userName === "PUBLIC") mirrorService.LoadGeneralWidgets();
    else mirrorService.currentUser === null;
  }
);

// Initialize app

try {
  // Set up secrets for debugging, mainly private api keys
  setEnvironment("./secrets.env");

  // Start the admin backend
  // prettier-ignore
  adminService
    .ConfigureMiddleware()
    .ConfigureRoutes()
    .Listen(5000);

  // Create the database
  dataAdapter.InitializeDatabase("./db.txt");

  // Load installed widgets
  mirrorService.RegisterWidgets();

  recognitionService
    // Initialize faceapi.js
    .InitializeDetection()
    // Initialize camera
    .then((service) => service.InitializeCamera(512, 512))
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
