import * as Services from "../../Services";
import { Weather } from "./Widget_Weather";


export = (
  dataAdapter: Services.DataAdapter,
  mirrorService: Services.MirrorService,
  logger: Services.LoggingService
) => new Weather(dataAdapter, mirrorService, logger);