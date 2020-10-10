import { WidgetSettings, WidgetSettingsItem, WidgetSettingsItemType } from "./WidgetSetting";
import * as Data from "../Services/export";

export class TestWidgetSettings extends WidgetSettings {

    public TestText: string;
    public TestOption: string;
        
    constructor() {
        super([
            new WidgetSettingsItem("TestText", "Test Text", "Dies ist nur ein Test", false, WidgetSettingsItemType.TEXT, null, "TestWert"),
            new WidgetSettingsItem("TestOption", "Test Option", "Dies ist auch nur ein Test", false, WidgetSettingsItemType.OPTION, "Optionswert1|Optionswert2", null)
        ]);
    }
}