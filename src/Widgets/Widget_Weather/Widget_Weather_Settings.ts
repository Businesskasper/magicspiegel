import {
    WidgetSettings,
    WidgetSettingsItem,
    WidgetSettingsItemType
} from "../WidgetSetting";

export class WeatherWidgetSettings extends WidgetSettings {
  public CityName: string;
  public OpenWeatherMapApiKey: string;

  constructor() {
    super([
      new WidgetSettingsItem(
        "CityName",
        "Stadt",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "Ulm"
      ),
      new WidgetSettingsItem(
        "OpenWeatherMapApiKey",
        "OpenWeatherMap Api Key",
        "Der API Schlüssel kann kostenlos über eine Registrierung auf openweathermap.com aberufen werden.",
        false,
        WidgetSettingsItemType.TEXT,
        null,
        WidgetSettings.GetFromEnvironment("APIKEY_OPENWEATHERMAP")
      ),
    ]);
  }
}
