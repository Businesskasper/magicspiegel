import * as Services from "../../Services/export";
import { Widget } from "../Widget";
import { ClockWidgetSettings } from "./Widget_Clock_Settings";

export class Clock extends Widget {

    constructor(dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService){
        
        super(
            new ClockWidgetSettings(), 
            dataAdapter,
            mirrorService, 
            "Clock", 
            1,
            "Displays the clock and updates continously.", 
            "Luka"
        );
    }

    public Load(): void {
        
        this.Div.innerHTML += 
        `<div id="clock.time" style="font-family:Helvetica; font-size:100px; line-height:100px; height:100px; color:white"></div>
         <div id="clock.date" style="padding-left:10px; font-family:Helvetica; font-size:20px; line-height:40px; color:white"></div>
        `;

        this.ShowTime(this.Div);
    }

    public Refresh(): void {
        
    }

    private ShowTime(parentDiv: HTMLDivElement) : void {

        if (!parentDiv.isConnected) {

            return;
        }
        
        var today = new Date();

        document.getElementById('clock.time').innerHTML = this.FormatTime(today.getHours()) + ":" + this.FormatTime(today.getMinutes());
        document.getElementById('clock.date').innerHTML = this.GetWeekDay(today.getDay()) + " " + this.FormatTime(today.getDate()) + "." + this.FormatTime(today.getMonth() + 1) + "." + today.getFullYear();

        setTimeout(() => {

            this.ShowTime(parentDiv)
        }, 500);
    }

    private GetWeekDay(dayNumber : number) : string {
        
        let dayName : string;

        switch (dayNumber) {
            case 0:
                dayName = "So";
                break;
            case 1:
                dayName = "Mo";
                break;
            case 2:
                dayName = "Di";
                break;
            case 3:
                dayName = "Mi";
                break;
            case 4:
                dayName = "Do";
                break;
            case 5:
                dayName = "Fr";
                break;
            case 6:
                dayName = "Sa";
                break;
            default:
                dayName = "";
                break;
        }
        
        return dayName;
    }

    private FormatTime(i : number) : string {

        return (i < 10) ? "0" + i.toString() : i.toString();
    }
}