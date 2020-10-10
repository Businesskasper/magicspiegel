import { app, BrowserWindow } from "electron";
import * as path from "path";
import { Backend } from "../Express/Backend";
import * as Services from "../Services/export";
import {ipcMain} from 'electron';


let mainWindow : BrowserWindow;
let backend: Backend;

app.on('ready', () => {

    // Set up backend database access used for user registration and configuration
    let dataAdapter = new Services.DataAdapter();
   
    // This event will be triggered from the backend when a user changes the widget configuration. We use inter process communication to notify the main window.
    dataAdapter.onWidgetSettingsUpdatedEvent.subscribe((sender : Services.DataAdapter, userChanged: string) => {

        console.log(`onWidgetSettingsUpdatedEvent was received -> Initiating IPC WidgetSettingsUpdated`)
        mainWindow.webContents.send('WidgetSettingsUpdated', userChanged)
    })

    // The backend for our user interface
    backend = new Backend(dataAdapter)
        .ConfigureMiddleware()
        .ConfigureRoutes()
        .Listen(5000);


    // This is our main window for the widgets.
    mainWindow = new BrowserWindow({

        fullscreen: true,
        backgroundColor: "#000000",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {

        mainWindow = null
    });

    mainWindow.loadFile(path.join(__dirname, "../../index.html"));

    app.on('window-all-closed', () => {

        if (process.platform !== 'darwin') {

            app.quit();
        }
    });
})