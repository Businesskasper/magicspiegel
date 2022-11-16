import * as Services from "../../Services";
import { Todoist } from "./Widget_Todoist";


export = (
  dataAdapter: Services.DataAdapter,
  mirrorService: Services.MirrorService,
  logger: Services.LoggingService
) => new Todoist(dataAdapter, mirrorService, logger);