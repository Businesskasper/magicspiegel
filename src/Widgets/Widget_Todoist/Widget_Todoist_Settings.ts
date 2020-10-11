import { WidgetSettings, WidgetSettingsItem, WidgetSettingsItemType } from "../WidgetSetting";

export class TodoistWidgetSettings extends WidgetSettings {

    public Project: string;
    public ApiKey: string;
        
    constructor() {
        super([
            new WidgetSettingsItem("Project", "Projekt", null, false, WidgetSettingsItemType.TEXT, null, null),
            new WidgetSettingsItem("ApiKey", "Todoist Api Key", "Der API Schlüssel kann kostenlos über eine Registrierung auf todoist.com aberufen werden.", false, WidgetSettingsItemType.TEXT, null, WidgetSettings.GetFromEnvironment('APIKEY_TODOIST'))
        ]);
    }
}