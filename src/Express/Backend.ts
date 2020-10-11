import * as ExpressJs from "express";
import * as Services from "../Services/export";
import * as path from 'path';
import bodyParser = require("body-parser");
import * as Model from '../Model/export';
import { Widget } from "../Widgets/Widget";
import { WidgetSettings } from "../Widgets/WidgetSetting";
/*
* This is our backend for the user interface. You can register and manager widgets.
*/
export class Backend {

    private expressInstance: ExpressJs.Express;
    private dataAdapter: Services.DataAdapter;
    public bodyParser = import('body-parser');

    constructor(DataAdapter: Services.DataAdapter) {

        this.expressInstance = ExpressJs();
        this.dataAdapter = DataAdapter;
        // this.dataAdapter.InitializeDatabase("./db.txt"); //TODO: This should be unncesessary, since the database is set up by the main process.
    }

    public ConfigureMiddleware(): Backend {

        this.expressInstance
            .use(bodyParser.json())
            .use(ExpressJs.static(path.join("data", "Frontend")))
            .use('src', ExpressJs.static(path.join("data", "Frontend", "src")));

        return this;
    }

    public ConfigureRoutes(): Backend {

        this.expressInstance
            .post('/api/Widget', (req, res) => {

                let userWidgets : any = [];
                this.dataAdapter.Widget().forEach((widget: Widget) => {

                    let widgetSettings: WidgetSettings = this.dataAdapter.GetWidgetSettings(widget, new Model.User(req.body.UserName, null));
                    userWidgets.push({Widget: widget, Settings: widgetSettings});
                });

                res.json(userWidgets);
            })
            .post('/api/WidgetSettings/insert', (req, res) => {

                try {
                    
                    this.dataAdapter.InsertWidgetSettings(req.body.UserName,  req.body.Widget.Widget.Name,  req.body.Widget.Widget.Version, req.body.Widget.Settings)
                    res.sendStatus(200);
                }
                catch {

                    res.sendStatus(500);
                }
            })
            .get('/api/User', (req, res) => {

                res.json(this.dataAdapter.User(null));
            })
            .post('/api/User/new', (req, res) => {

                console.log(req.body);
                try {

                    let user = new Model.User(req.body.Name, new Array<Float32Array>());
                    Array.from(req.body.Descriptors).forEach((descriptor) => {

                        user.Descriptors.push(new Float32Array(JSON.parse(`[${descriptor.toString()}]`)));
                    });

                    this.dataAdapter.InsertUser(user);
                    res.sendStatus(200);
                }
                catch {

                    res.sendStatus(500);
                }
            })
            .post('/api/User/delete', (req, res) => {

                console.log(req.body);
                try {
                    
                    this.dataAdapter.DeleteUser(req.body.Name);
                    res.sendStatus(200);
                }
                catch {

                    res.sendStatus(500);
                }
            })
            .get('/', (req, res) => {

                res.redirect('/index.html')
            })

        return this;
    }

    public Listen(port: number): Backend {
        
        this.expressInstance.listen(port, this.Logger('Listening on Port 5000'));
        return this;
    }

    private Logger(logLine: string): () => void {

        return () => {

            console.log(`Express: ${logLine}`);
        }
    }
}

