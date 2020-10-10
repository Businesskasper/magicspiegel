import * as Service from "../Services/export";
import { MapsWidgetSettings } from "./Widget_Maps_Settings";
import { Widget } from "./Widget";

class Maps extends Widget {

    constructor(dataAdapter: Service.DataAdapter, mirrorService: Service.MirrorService){

        super(
            new MapsWidgetSettings(), 
            dataAdapter,
            mirrorService, 
            "Maps",
            1,
            "Zeigt die aktuelle Reisedauer nach Google Maps",
            "Luka"
        );
    }

    public Load(): void {
        
        let routeToShow = this.GetRelevantRoute((<MapsWidgetSettings>this.WidgetSettings)); 
        if (routeToShow !== null) {

            this.DisplayTravelTime(routeToShow.From, routeToShow.To, routeToShow.TravelMode, this.Div, (<MapsWidgetSettings>this.WidgetSettings).GoogleApiKey)
        }
    }

    public Refresh(): void {
        
        //Reload iframe
        let iframe_maps = document.getElementById("iframe_maps");
        (<HTMLIFrameElement>iframe_maps).src = (<HTMLIFrameElement>iframe_maps).src;
    }

    private GetRelevantRoute(widgetSettings: MapsWidgetSettings) : any {

        let startDate = new Date()

        //Route1
        if ((widgetSettings.To1 !== null && widgetSettings.To1 !== undefined && widgetSettings.To1.trim() !== '')
        && (widgetSettings.From !== null && widgetSettings.From !== undefined && widgetSettings.From.trim() !== '')
        && (widgetSettings.Until1 !== null && widgetSettings.Until1 !== undefined && widgetSettings.Until1.trim() !== '')
        && widgetSettings.Until1.split(":")[0].trim() !== '' && widgetSettings.Until1.split(":")[0].trim() !== '' ) {

            startDate.setHours(parseInt(widgetSettings.Until1.split(":")[0]));
            startDate.setMinutes(parseInt(widgetSettings.Until1.split(":")[1]));

            if (new Date() < startDate) {

                return {From: widgetSettings.From, To: widgetSettings.To1, TravelMode: widgetSettings.TravelMode1}
            }
        }
        
        //Route2
        if ((widgetSettings.To2 !== null && widgetSettings.To2 !== undefined && widgetSettings.To2.trim() !== '')
        && (widgetSettings.From !== null && widgetSettings.From !== undefined && widgetSettings.From.trim() !== '')
        && (widgetSettings.Until2 !== null && widgetSettings.Until2 !== undefined && widgetSettings.Until2.trim() !== '')
        && widgetSettings.Until2.split(":")[0].trim() !== '' && widgetSettings.Until2.split(":")[0].trim() !== '' ) {

            startDate.setHours(parseInt(widgetSettings.Until2.split(":")[0]));
            startDate.setMinutes(parseInt(widgetSettings.Until2.split(":")[1]));

            if (new Date() < startDate) {

                return {From: widgetSettings.From, To: widgetSettings.To2, TravelMode: widgetSettings.TravelMode2}
            }
        }

        return null;
    }

    private DisplayTravelTime(from: string, to: string, travelType:string, parentDiv: HTMLDivElement, mapsApiKey: string) : void {

        parentDiv.innerHTML += `<iframe id="iframe_maps" width="400" height="300" frameborder="0" style="border:0; font-family: Helvetica;" src="" allowfullscreen></iframe>`
    
        let requestString = "https://www.google.com/maps/embed/v1/directions?";
        requestString += "origin=" + from.replace(" ", "+");
        requestString += "&destination=" + to.replace(" ", "+");
        requestString += "&key=" + mapsApiKey;
        if (travelType === "Bus/Bahn") {

            requestString += "&mode=transit";
        }
    
        let iframe_maps = document.getElementById("iframe_maps");
        (<HTMLIFrameElement>iframe_maps).src = requestString;    
    }
}

export = (da: Service.DataAdapter, ms: Service.MirrorService) => new Maps(da, ms);