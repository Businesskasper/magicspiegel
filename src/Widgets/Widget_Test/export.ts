import * as Services from "../../Services/export";
import { Test } from "./Widget_Test";


export = (dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService) => new Test(dataAdapter, mirrorService);