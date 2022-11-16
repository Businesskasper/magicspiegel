import * as Services from "../../Services";
import { Clock } from "./Widget_Clock";


export = (
  dataAdapter: Services.DataAdapter,
  mirrorService: Services.MirrorService,
  logger: Services.LoggingService
) => new Clock(dataAdapter, mirrorService, logger);