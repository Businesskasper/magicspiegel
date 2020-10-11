import * as Services from "../../Services/export";
import { Todoist } from "./Widget_Todoist";


export = (dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService) => new Todoist(dataAdapter, mirrorService);