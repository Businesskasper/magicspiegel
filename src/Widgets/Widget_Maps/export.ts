import * as Services from "../../Services";
import { Maps } from "./Widget_Maps";

export = (
  dataAdapter: Services.DataAdapter,
  mirrorService: Services.MirrorService,
  logger: Services.LoggingService
) => new Maps(dataAdapter, mirrorService, logger);
