import { app, BrowserWindow } from "electron";
import * as path from "path";

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
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 1920,
    width: 1080,
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
  // mainWindow.webContents.openDevTools();
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  app.quit();
});
