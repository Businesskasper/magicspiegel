import * as Services from "../../Services/export";
import { Clock } from "./Widget_Clock";


export = (dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService) => new Clock(dataAdapter, mirrorService);