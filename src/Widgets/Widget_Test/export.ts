import * as Services from "../../Services";
import { Test } from "./Widget_Test";


export = (
  dataAdapter: Services.DataAdapter,
  mirrorService: Services.MirrorService,
  logger: Services.LoggingService
) => new Test(dataAdapter, mirrorService, logger);