import * as ExpressJs from "express";
import * as path from "path";
import { EventDispatcher, IEvent } from "strongly-typed-events";
import * as Events from "../Events";
import * as Model from "../Models";
import * as Services from "../Services";

/*
 * This is our backend for the user interface. You can register and manager widgets.
 */
export class AdminService {
  private expressInstance: ExpressJs.Express;

  // This gets triggered from the frontend if the user updates his profile or the public widgets.
  private widgetSettingsUpdatedEvent = new EventDispatcher<
    Services.AdminService,
    Events.UserUpdated
  >();
  public get onWidgetSettingsUpdatedEvent(): IEvent<Services.AdminService, Events.UserUpdated> {
    return this.widgetSettingsUpdatedEvent.asEvent();
  }

  constructor(private dataAdapter: Services.DataAdapter, private logger: Services.LoggingService) {
    this.expressInstance = ExpressJs();
  }

  public ConfigureMiddleware(): AdminService {
    this.expressInstance
      .use(ExpressJs.json())
      .use(ExpressJs.static(path.join("data", "AdminPanel")))
      .use("src", ExpressJs.static(path.join("data", "AdminPanel", "src")));

    return this;
  }

  public ConfigureRoutes(): AdminService {
    this.expressInstance
      // .get("/api/test", (req, res) => {
      //   const widgets = this.dataAdapter.Widget().map(widget => {
      //     const settings = this.dataAdapter.GetWidgetSettingsObject(widget);
      //     return { widget, settings };
      //   })
      //   res.json(widgets);
      // })
      .get("/api/Widget", (_, res) => {
        const widgets = this.dataAdapter.Widget();
        res.json(widgets);
      })
      .get("/api/User/:userName?", (req, res) => {
        const { userName } = req.params;
        res.json(this.dataAdapter.User(userName || null));
      })
      .put("/api/User/:userName", (req, res) => {
        try {
          const { userName: name } = req.params;
          const descriptors = req.body.Descriptors?.map(
            (descriptor: string) => new Float32Array(JSON.parse(`[${descriptor.toString()}]`))
          );
          const user: Model.User = {
            name,
            descriptors,
          };
          this.dataAdapter.InsertUser(user);

          res.sendStatus(200);
        } catch (err) {
          res.status(500).send({ error: err.toString() });
        }
      })
      .delete("/api/User/:userName", (req, res) => {
        const { userName } = req.params;
        try {
          this.dataAdapter.DeleteUser(userName);
          res.sendStatus(200);
        } catch (err) {
          res.status(500).send({ error: err.toString() });
        }
      })
      .get("/api/User/:userName/WidgetSettings/:widgetName/:widgetVersion", (req, res) => {
        const { userName, widgetName, widgetVersion } = req.params;
        const shape = this.dataAdapter.GetWidgetSettingsObject(widgetName, widgetVersion)
        const widgetSettings = this.dataAdapter.GetWidgetSettings(
          userName,
          widgetName,
          widgetVersion
        );

        res.json({ ...shape, ...widgetSettings });
      })
      .put("/api/User/:userName/WidgetSettings/:widgetName/:widgetVersion", (req, res) => {
        const { userName, widgetName, widgetVersion } = req.params;
        console.log('body', JSON.stringify(req.body || {}))
        try {
          this.dataAdapter.InsertWidgetSettings(
            userName,
            widgetName,
            Number(widgetVersion),
            req.body
          );
          
          this.widgetSettingsUpdatedEvent.dispatch(this, { userName });
          res.sendStatus(200);
        } catch (err) {
          res.status(500).send({ error: err.toString() });
        }
      })
      .get("/", (req, res) => {
        res.redirect("/index.html");
      });
    return this;
  }

  public Listen(port: number): AdminService {
    this.expressInstance.listen(port, () => this.logger.Info(`Listening on port ${port.toString()}`));
    return this;
  }
}
