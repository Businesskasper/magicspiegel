import * as Models from "../Models";
import * as Services from "../Services";
import { WidgetSettings } from "./WidgetSetting";

/*
 * This class serves as a base for widgets. It is not inteded to be instanciated directly. A widget has to supply some base information like Name, Author, Description,...
 * Further more, a widget has a corresponding WidgetSettings class, which includes the settings that are presented to the user. This settings class will be available once
 * the widget gets loaded. The widget only has access to those information, no other data from the Database will be provided.
 */
export abstract class Widget {
  Name: string;
  Version: number;
  Description: string;
  Author: string;
  WidgetSettings: WidgetSettings;
  Div: HTMLDivElement;

  MirrorService: Services.MirrorService;
  DataAdater: Services.DataAdapter;
  Logger: Services.LoggingService;

  constructor(
    widgetSettings: WidgetSettings,
    dataAdapter: Services.DataAdapter,
    logger: Services.LoggingService,
    mirrorService: Services.MirrorService,
    name: string,
    version: number,
    description: string,
    author: string
  ) {
    this.WidgetSettings = widgetSettings;
    this.DataAdater = dataAdapter;
    this.MirrorService = mirrorService;
    this.Logger = logger;

    this.Name = name;
    this.Version = version;
    this.Description = description;
    this.Author = author;

    // We listen to the currentUserChanged event. If the current user has this widget enabled and set up we invoke the Load() function.
    mirrorService.onCurrentUserChanged.subscribe(
      (sender, { userLoaded }: Models.UserLoaded) => {
        const widgetSettings = this.DataAdater.GetWidgetSettings(
          userLoaded.name,
          this.Name,
          this.Version?.toString()
        );

        if (widgetSettings.Enabled) {
          this.WidgetSettings = widgetSettings;

          const containerDiv = document.createElement("div");
          containerDiv.classList.add("widget");
          containerDiv.classList.add(userLoaded.name.toUpperCase());
          containerDiv.setAttribute("id", this.Name);
          containerDiv.style.margin = "30px";
          containerDiv.style.marginBottom = "55px";
          containerDiv.style.border = "0";

          if (this.WidgetSettings.Div === "rechts") {
            containerDiv.style.display = "flex";
            containerDiv.style.justifyContent = "flex-end";
          }

          this.Div = document.createElement("div");
          containerDiv.appendChild(this.Div);

          document
            .getElementById(
              `${this.WidgetSettings.Div}-${this.WidgetSettings.Row}`
            )
            .appendChild(containerDiv);

          this.Load();
        }
      }
    );

    // We listen to the currentUserRefreshed event. If the current user has this widget enabled, we invoke the Refresh() function.
    mirrorService.onCurrentUserRefreshed.subscribe(
      (sender: Services.MirrorService, userLoaded: Models.UserLoaded) => {
        if (this.WidgetSettings.Enabled) {
          this.Refresh();
        }
      }
    );
  }

  // This function is invoked when the widget gets detected and registered. The DataAdapter will store the widget, general information and the setting items from the WidgetSettings class.
  public Register(): void {
    this.Logger.Info(`Registering ${this.Name} on Version ${this.Version}`);
    this.DataAdater.InsertWidget(this);
  }

  // This function gets invoked when the user profile is loaded.
  public abstract Load(): void;

  // This function gets invoked when the user profile gets refreshed. E. g. when the same user looks into the mirror after a certain time threshold.
  public abstract Refresh(): void;
}
