import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as Services from './Services';
import * as Events from './Events';

// // Live reload for development
// // TODO - add electron-isdev
// const isDev = true;
// if (isDev) {
//   const electronReload = require("electron-reload")(path.resolve(__dirname, ".."), {
//     ignoreInitial: false,
//     awaitWriteFinish: true,
//   });
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  // Create backend for admin-service
  // Runs in main process to prevent blocking
  const logger = new Services.LoggingService(console.log);
  const dataAdapter = new Services.DataAdapter(logger, "./magicspiegel.db");
  const adminService = new Services.AdminService(dataAdapter, logger);

  adminService.onWidgetSettingsUpdatedEvent.subscribe((sender: Services.AdminService, event: Events.UserUpdated) => {
    mainWindow.webContents.send(Events.UserUpdatedToken, event);
  })

  adminService
    .ConfigureMiddleware()
    .ConfigureRoutes()
    .Listen(5000);

  // Create the browser window
  const mainWindow = new BrowserWindow({
    height: 1920,
    width: 1080,
    // fullscreen: true,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      allowRunningInsecureContent: true,
      webgl: true,
      webSecurity: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  app.quit();
});
