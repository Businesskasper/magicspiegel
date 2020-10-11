import * as Services from "../../Services/export";
import { Widget } from "../Widget";
import { TestWidgetSettings } from "./Widget_Test_Settings";

export class Test extends Widget {

    constructor(dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService){
        
        super(
            new TestWidgetSettings(), 
            dataAdapter,
            mirrorService, 
            "Test", 
            1,
            "Mein TestWidget", 
            "Luka"
        );
    }

    public Load(): void {
        
        this.Div.innerHTML += `<div style="font-size:45px; color:white">${(<TestWidgetSettings>this.WidgetSettings).TestText}</div>`;
    }

    public Refresh(): void {
        
    }
}

