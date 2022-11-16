import {
    WidgetSettings,
    WidgetSettingsItem,
    WidgetSettingsItemType
} from "../WidgetSetting";

export class GtfsWidgetSettings extends WidgetSettings {
  public GtfsBaseAddress: string;
  public Start: string;
  public Destination: string;

  constructor() {
    super([
      new WidgetSettingsItem(
        "GtfsBaseAddress",
        "GTFS Basisadresse",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "https://gtfs.swu.de/daten/"
      ),
      new WidgetSettingsItem(
        "Start",
        "Start",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "Theater"
      ),
      new WidgetSettingsItem(
        "Destination",
        "Ziel",
        null,
        false,
        WidgetSettingsItemType.TEXT,
        null,
        "Hörvelsinger Weg"
      ),
    ]);
  }
}
