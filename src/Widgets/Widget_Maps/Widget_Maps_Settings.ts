import {
    WidgetSettings,
    WidgetSettingsItem,
    WidgetSettingsItemType
} from "../WidgetSetting";

export class MapsWidgetSettings extends WidgetSettings {
  public GoogleApiKey: string;
  public From: string;
  public Until1: string;
  public To1: string;
  public TravelMode1: string;
  public Until2: string;
  public To2: string;
  public TravelMode2: string;

  constructor() {
    super([
      new WidgetSettingsItem(
        "GoogleApiKey",
        "Google API Key",
        "Kann kostenlos über https://console.cloud.google.com/ bezogen werden",
        false,
        WidgetSettingsItemType.TEXT,
        null,
        WidgetSettings.GetFromEnvironment("APIKEY_MAPS")
      ),
      new WidgetSettingsItem(
        "From",
        "Heimadresse",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "Unter der Metzig 8, Ulm"
      ),
      new WidgetSettingsItem(
        "Until1",
        "Bis Uhrzeit",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "09:00"
      ),
      new WidgetSettingsItem(
        "To1",
        "Ziel",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "Hoervelsingerweg 17, Ulm"
      ),
      new WidgetSettingsItem(
        "TravelMode1",
        "Reisetyp",
        null,
        false,
        WidgetSettingsItemType.OPTION,
        "Auto|Bus/Bahn",
        "Auto"
      ),
      new WidgetSettingsItem(
        "Until2",
        "Bis Uhrzeit",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "22:00"
      ),
      new WidgetSettingsItem(
        "To2",
        "Ziel",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "Erhard-Groetzinger-Straße 11, Blaustein"
      ),
      new WidgetSettingsItem(
        "TravelMode2",
        "Reisetyp",
        null,
        false,
        WidgetSettingsItemType.OPTION,
        "Auto|Bus/Bahn",
        "Auto"
      ),
    ]);
  }
}
