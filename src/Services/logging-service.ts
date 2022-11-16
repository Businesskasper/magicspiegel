import { black, Chalk, green, grey, red } from "chalk";

type LogLevel = "INFO" | "ERROR" | "DEBUG";

export class LoggingService {
  private colors: { [key in LogLevel]: Chalk } = {
    INFO: green,
    ERROR: red,
    DEBUG: grey,
  };

  constructor(private logMethod: (message: string) => void) {}

  Info(message: string) {
    this.Log("INFO", message);
  }

  Error(message: string) {
    this.Log("ERROR", message);
  }

  Debug(message: string) {
    this.Log("DEBUG", message);
  }

  private Log(logLevel: LogLevel, message: string) {
    const stack = new Error().stack;
    const callerLine = stack?.split("\n")[3] || "";
    const callerMethod = callerLine?.replace("    at ", "").replace(/\(.*/, "");

    const formatter = this.colors[logLevel] ?? black;

    this.logMethod(formatter(`${logLevel}: ${callerMethod} - ${message}`));
  }
}
