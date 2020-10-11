import * as Services from "../../Services/export";
import { Weather } from "./Widget_Weather";


export = (dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService) => new Weather(dataAdapter, mirrorService);