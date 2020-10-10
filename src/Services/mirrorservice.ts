import { EventDispatcher, IEvent } from "strongly-typed-events";
import * as Model from "../Model/export";
import * as Services from "./export";
import * as fs from "fs";
import * as path from "path";
import { Widget } from "../Widgets/Widget";

/* 
* This is the main "worker" which will present our widets and decide when to load a new profile.
*/
export class MirrorService {

    private dataAdapter : Services.DataAdapter;

    public currentUser : Model.UserLoaded;

    private currentUserChanged = new EventDispatcher<MirrorService, Model.UserLoaded>();
    public get currentUserChangedEvent(): IEvent<MirrorService, Model.UserLoaded> {

        return this.currentUserChanged.asEvent();
    }

    private currentUserRefreshed = new EventDispatcher<MirrorService, Model.UserLoaded>();
    public get currentUserRefreshedEvent(): IEvent<MirrorService, Model.UserLoaded> {
        
        return this.currentUserRefreshed.asEvent();
    }

    private widgetsRegistered: Widget[];
    

    constructor(_dataAdapter : Services.DataAdapter) {

        this.dataAdapter = _dataAdapter;
        this.widgetsRegistered = new Array<Widget>();
    }

    private setNewCurrentUser(userLoaded: Model.UserLoaded): void  {

        if (userLoaded !== null) {

            this.currentUser = userLoaded;
            this.SayHi(this.currentUser.UserLoaded);
            this.currentUserChanged.dispatch(this, this.currentUser);
        }
    }

    private refreshCurrentUser(): void {
        
        this.currentUser.UserLoadedOn = new Date();
        this.currentUserRefreshed.dispatch(this, this.currentUser);
    }

    public SayHi(user : Model.User) : void {

        document.querySelectorAll('.widget:not(.public)').forEach((element: Element) => {

            element.remove();
        })

        document.getElementById("links").style.display = "none";
        document.getElementById("rechts").style.display = "none";

        var greeterDiv = document.createElement("div");
        greeterDiv.style.width="600";
        greeterDiv.style.height = "100";
        greeterDiv.style.margin = "0 auto";
        greeterDiv.style.color = "#FFFFFF";
        greeterDiv.style.fontFamily = "Helvetica";
        greeterDiv.style.fontSize = "100px";
        greeterDiv.style.position = "fixed";
        greeterDiv.style.top = "50%";
        greeterDiv.style.left = "50%";
        greeterDiv.style.transform = "translate(-50%, -50%)";

        greeterDiv.innerHTML = "Hallo " + user.Name + " :)";

        document.getElementById('container').appendChild(greeterDiv);

        setTimeout(() => {

            document.getElementById('container').removeChild(greeterDiv);
            document.getElementById("links").style.display = "block";
            document.getElementById("rechts").style.display = "block";

        }, 5000)
    }

    public RegisterWidgets(): void {

        console.log("MirrorService.LoadWidgets() -> Starting")
    
        fs.readdirSync(path.resolve(__dirname, "../Widgets")).forEach((installedWidget) => {

            if (installedWidget.startsWith("Widget_") && installedWidget.endsWith(".js") && !(installedWidget.endsWith("Settings.js") || installedWidget.endsWith(".ignore") || installedWidget.endsWith("Classes.js"))) {

                console.log(`"MirrorService.LoadWidgets() -> Found widget ${installedWidget}`);  
                let widgetFactory = require(path.resolve(__dirname, "../Widgets", installedWidget));
                let widget : Widget = widgetFactory(this.dataAdapter, this);
                this.widgetsRegistered.push(widget);
                widget.Register();
            }
        })

        this.LoadGeneralWidgets();
    }

    public LoadGeneralWidgets(): void {

        console.log("Display general Widgets");

        document.querySelectorAll('.widget.public').forEach((element : Element) => {

            element.remove();
        })

        this.currentUserChanged.dispatch(this, new Model.UserLoaded(new Date(), new Model.User('PUBLIC', null)));
    }

    public SetCurrentUser(userName : string) : void {

        let users : Model.User[] = this.dataAdapter.User(userName);

        if (users.length === 0) {
        
            return;
        }
        
        let user: Model.User = users[0];

        if (this.currentUser === undefined || this.currentUser === null) {

            console.log(`MirrorService.SetCurrentUser() -> User was undefined, setting to ${user.Name}`)
            this.setNewCurrentUser(new Model.UserLoaded(new Date(), user));
        }
        else {

            let a: Date = new Date(this.currentUser.UserLoadedOn);
            a.setMinutes(this.currentUser.UserLoadedOn.getMinutes() + 5);

            let b : Date = new Date(this.currentUser.UserLoadedOn);
            b.setMinutes(this.currentUser.UserLoadedOn.getMinutes() + 1);

            if (this.currentUser.UserLoaded.Name == user.Name && new Date() > a) {
                
                console.log(`MirrorService.SetCurrentUser() -> User ${this.currentUser.UserLoaded.Name} timed out, refreshing him`)
                this.refreshCurrentUser();
            }
            else if (this.currentUser.UserLoaded.Name !== user.Name && new Date() > b) {

                console.log(`MirrorService.SetCurrentUser() -> User changed, setting to ${user.Name}`)
                this.setNewCurrentUser(new Model.UserLoaded(new Date(), user));
            }
        }
    }
}