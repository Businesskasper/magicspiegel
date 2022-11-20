import * as fs from "fs";
import * as path from "path";
import { EventDispatcher, IEvent } from "strongly-typed-events";
import * as Services from ".";
import * as Models from "../Models";
import { Widget } from "../Widgets/Widget";

/*
 * This is the main "worker" which will present our widets and decide when to load a new profile.
 */
export class MirrorService {
  public currentUser: Models.UserLoaded;

  private currentUserChangedEvent = new EventDispatcher<
    MirrorService,
    Models.UserLoaded
  >();
  public get onCurrentUserChanged(): IEvent<MirrorService, Models.UserLoaded> {
    return this.currentUserChangedEvent.asEvent();
  }

  private currentUserRefreshed = new EventDispatcher<
    MirrorService,
    Models.UserLoaded
  >();
  public get onCurrentUserRefreshed(): IEvent<
    MirrorService,
    Models.UserLoaded
  > {
    return this.currentUserRefreshed.asEvent();
  }

  private widgetsRegistered = new Array<Widget>();

  constructor(
    private dataAdapter: Services.DataAdapter,
    private logger: Services.LoggingService
  ) {}

  public setNewCurrentUser(userLoaded: Models.UserLoaded): void {
    if (userLoaded !== null) {
      this.currentUser = userLoaded;
      this.SayHi(this.currentUser.userLoaded);
      this.currentUserChangedEvent.dispatch(this, this.currentUser);
    }
  }

  private refreshCurrentUser(): void {
    if (!this.currentUser) {
      this.logger.Error('refreshCurrentUser was dispatched, but no currentUser is was set');
    }
    this.currentUser.userLoadedOn = new Date();
    this.currentUserRefreshed.dispatch(this, this.currentUser);
  }

  public SayHi(user: Models.User): void {
    document
      .querySelectorAll(".widget:not(.public)")
      .forEach((element: Element) => {
        element.remove();
      });

    document.getElementById("links").style.display = "none";
    document.getElementById("rechts").style.display = "none";

    var greeterDiv = document.createElement("div");
    greeterDiv.style.width = "600";
    greeterDiv.style.height = "100";
    greeterDiv.style.margin = "0 auto";
    greeterDiv.style.color = "#FFFFFF";
    greeterDiv.style.fontFamily = "Helvetica";
    greeterDiv.style.fontSize = "100px";
    greeterDiv.style.position = "fixed";
    greeterDiv.style.top = "50%";
    greeterDiv.style.left = "50%";
    greeterDiv.style.transform = "translate(-50%, -50%)";

    greeterDiv.innerHTML = "Hallo " + user.name + " :)";

    document.getElementById("container").appendChild(greeterDiv);

    setTimeout(() => {
      document.getElementById("container").removeChild(greeterDiv);
      document.getElementById("links").style.display = "block";
      document.getElementById("rechts").style.display = "block";
    }, 5000);
  }

  public RegisterWidgets(): void {
    this.logger.Info(`Registering Widgets`);

    fs.readdirSync(path.resolve(__dirname, "../Widgets"), {
      withFileTypes: true,
    })
      .filter((item) => item.isDirectory())
      .forEach((directory) => {
        let widgetExport: string = path.resolve(
          __dirname,
          "../Widgets",
          directory.name,
          "export.js"
        );
        if (fs.existsSync(widgetExport)) {
          const widgetFactory = require(widgetExport);
          const widget = widgetFactory(this.dataAdapter, this, this.logger);
          this.widgetsRegistered.push(widget);
          widget.Register();
        }
      });

    this.LoadGeneralWidgets();
  }

  public LoadGeneralWidgets(): void {
    this.logger.Debug("Displaying general Widgets");

    document.querySelectorAll(".widget.public").forEach((element: Element) => {
      element.remove();
    });

    this.currentUserChangedEvent.dispatch(this, {
      userLoadedOn: new Date(),
      userLoaded: {
        name: "PUBLIC",
        descriptors: null,
      },
    });
  }

  public SetCurrentUser(userName: string): void {
    let users = this.dataAdapter.User(userName);

    if (users.length === 0) {
      return;
    }

    let user = users[0];
    console.log('SetCurrentUser invoked, currentUser is: ', this.currentUser);

    if (this.currentUser === undefined || this.currentUser === null) {
      this.logger.Info(
        `MirrorService.SetCurrentUser() -> User was undefined, setting to ${user.name}`
      );
      this.setNewCurrentUser({ userLoadedOn: new Date(), userLoaded: user });
    } else {
      let a: Date = new Date(this.currentUser.userLoadedOn);
      a.setMinutes(this.currentUser.userLoadedOn.getMinutes() + 5);

      let b: Date = new Date(this.currentUser.userLoadedOn);
      b.setMinutes(this.currentUser.userLoadedOn.getMinutes() + 1);

      if (this.currentUser.userLoaded.name == user.name && new Date() > a) {
        this.logger.Info(
          `MirrorService.SetCurrentUser() -> User ${this.currentUser.userLoaded.name} timed out, refreshing him`
        );
        this.refreshCurrentUser();
      } else if (
        this.currentUser.userLoaded.name !== user.name &&
        new Date() > b
      ) {
        this.logger.Info(
          `MirrorService.SetCurrentUser() -> User changed, setting to ${user.name}`
        );
        this.setNewCurrentUser({ userLoadedOn: new Date(), userLoaded: user });
      }
    }
  }

  public SetupDetection(): void {}
}
