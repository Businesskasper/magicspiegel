/*
* This class serves as a base for widget settings. It is not inteded to be instanciated directly. Widget settings are those settings specific to a user. E.g. for a weather widget, the user can select the current location.
* Every widget settings class has to implement information about where to load the widget on the ui.
* Widget settings are stored in the database as "WidgetSettingsItem" objects.
*/ 
export abstract class WidgetSettings {

    public Div: string;
    public Row: number;
    public Enabled: boolean;

    public WidgetSettingsItems: WidgetSettingsItem[];

    constructor(widgetSettingsItems: WidgetSettingsItem[]) {
        
        this.WidgetSettingsItems = new Array<WidgetSettingsItem>();
        
        this.WidgetSettingsItems.push(new WidgetSettingsItem("Enabled", "Aktiviert", null, false, WidgetSettingsItemType.BOOLEAN, null, false));
        this.WidgetSettingsItems.push(new WidgetSettingsItem("Div", "Bereich", null, false, WidgetSettingsItemType.OPTION, "rechts|links", "links"));
        this.WidgetSettingsItems.push(new WidgetSettingsItem("Row", "Reihe", null, false, WidgetSettingsItemType.OPTION, "1|2|3|4|5|6", "1"));

        if (widgetSettingsItems !== undefined) {
            
            this.WidgetSettingsItems = this.WidgetSettingsItems, widgetSettingsItems;
        }
    }

    // This is mainly for development. Secrets, like api keys, should not be stored directly in the "Default" field.
    public static GetFromEnvironment(variableName :string): string {

        return process.env[variableName] ?? "";
    }
}


export enum WidgetSettingsItemType {
    
    TEXT,
    INTEGER,
    BOOLEAN,
    OPTION
}

/*
* A WidgetSettingsItem is one setting key - value for a widget. Like the location setting on a weather widget. The item has to implement specific information. Read the comments below for more information.
*/
export class WidgetSettingsItem {
    
    // The name of the setting
    public Key: string 

    // The name which is presented to the user on the ui
    public FriendlyName: string
    
    // A description which is presented on the ui. This can be used to inform the user on how to obtain an api key for the widget.
    public Description: string
    
    // If the setting should be editable on the frontend -> I don't really have a usecase for this, but it might come in handy.
    public ReadOnly: boolean
    
    // The datatype in the database.
    public Type: WidgetSettingsItemType
    
    // "Options" will be translated into a dropdown on the frontend.
    public Options: string
    
    // You can choose a preset. The preset muste be of the same datatype as specified in "WidgetSettingsItemType". It must also be included in the "Options" field (if the field is used).
    public PresetValue: any

    constructor(key: string, friendlyName: string, description: string, readOnly: boolean, type: WidgetSettingsItemType, options: string, presetValue: any) {
        
        this.Key = key;
        this.FriendlyName = friendlyName;
        this.Description = description;
        this.ReadOnly = readOnly;
        this.Type = type;
        this.Options = options;
        this.PresetValue = presetValue;
    }
}