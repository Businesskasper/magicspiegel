import * as Services from "../../Services/export";
import { Maps } from "./Widget_Maps";


export = (dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService) => new Maps(dataAdapter, mirrorService);