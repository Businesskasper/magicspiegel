import * as Services from "../../Services/export";
import { Widget } from "../Widget";
import { GtfsWidgetSettings } from "./Widget_GTFS_Settings";
import * as url from "url";
import * as GtfsClasses from "./Widget_GTFS_Classes";

class Gtfs extends Widget {

    public agency: GtfsClasses.Agency;
    public calendar_dates: GtfsClasses.CalendarDates[];
    public feed_info: GtfsClasses.FeedInfo[];
    public routes: GtfsClasses.Routes[];
    public stops: GtfsClasses.Stops[];
    public stop_times: GtfsClasses.StopTimes[];
    public trips: GtfsClasses.Trips[];


    constructor(dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService) {
        
        super(
            new GtfsWidgetSettings(), 
            dataAdapter,
            mirrorService, 
            "Gtfs", 
            1,
            "Fahrpläne für öffentliche Verkehrsmittel per GTFS Protokoll", 
            "Luka"
        );
    }

    public Load(): void {
        
        //Build table
        let table: HTMLTableElement = document.createElement('table');
        this.Div.appendChild(table);
        table.style.fontFamily = "Helvetica";
        table.style.fontSize = "20px";
        table.style.color = "white";

        let headerRow = document.createElement('tr');
        table.appendChild(headerRow);

        let tableHeaderSymbol = document.createElement('th');
        headerRow.appendChild(tableHeaderSymbol);
        tableHeaderSymbol.style.paddingRight = "15px";
        tableHeaderSymbol.innerHTML = `<h3><i class="fas fa-bus"></i></h3>`;

        let tableHeaderRouteInfo = document.createElement('th');
        headerRow.appendChild(tableHeaderRouteInfo);
        tableHeaderRouteInfo.innerHTML = `<h3>${(<GtfsWidgetSettings>this.WidgetSettings).Start}&nbsp;<i class="fas fa-angle-right"></i>&nbsp;${(<GtfsWidgetSettings>this.WidgetSettings).Destination}</h3>`


        this.initGtfsData().then(() => {

            console.log(`Widget GTFS -> Data fetched`)
            
            let tripsToShow = this.getRoutes((<GtfsWidgetSettings>this.WidgetSettings).Start, (<GtfsWidgetSettings>this.WidgetSettings).Destination);
            
            tripsToShow.forEach((tripToShow: any, key: any) => {

                let talbeRow = document.createElement('tr');
                table.appendChild(talbeRow);

                let tdBusLinie = document.createElement('td');
                tdBusLinie.style.paddingRight = "15px";
                tdBusLinie.style.float = "right";
                talbeRow.appendChild(tdBusLinie);

                tdBusLinie.innerHTML = `<div>${key.toString()}</div>`;

                let tdRoute = document.createElement('td');
                tdRoute.style.padding = "3px";
                talbeRow.appendChild(tdRoute);

                tripToShow.forEach((stop: any) => {

                    tdRoute.innerHTML += `<div>${ this.FormatTime(stop.departure_time.getHours()) + ":" + this.FormatTime(stop.departure_time.getMinutes()) }&nbsp;-&nbsp;${this.stops.filter(x => x.stop_id === stop.stop_id)[0].stop_name} </div>`;
                })
            })


            console.log(tripsToShow);
        });
    }

    public Refresh(): void {
        
    }


    public getRoutes(start: string, destination: string): any {

        // Haltestellen IDs abfragen -> Je nach Richtung gibt es mehrere Haltestellen
        let stopStartIds = this.stops.filter(x => x.stop_name === start).map(x => x.stop_id);
        let stopDestinationIds = this.stops.filter(x => x.stop_name === destination).map(x => x.stop_id);

        // Haltestellen Halte nach Fahrten gruppieren
        let now = new Date();
        let stop_times = this.groupBy(this.stop_times.filter(x => x.departure_time > now), (stopTimes: GtfsClasses.StopTimes) => stopTimes.trip_id);

        // Route abfragen
        let linie_trip: Map<Number, Number> = new Map<Number, Number>();
        this.AddTrip(stop_times, linie_trip, stopStartIds, stopDestinationIds);

        return linie_trip;
    }


    public AddTrip(groupedStopTimes: Map<Number, GtfsClasses.StopTimes[]>, linie_trip: Map<any, any>, startStopIds: Number[], destinationStopIds: Number[]): void {

        groupedStopTimes.forEach((groupedStopTime, tripId: Number) => {

            let startStop = groupedStopTime.filter(x => startStopIds.includes(x.stop_id))[0];
            if (startStop === undefined) {

                return;
            }
            let destinationStop = groupedStopTime.filter(x => destinationStopIds.includes(x.stop_id) && x.stop_sequence > startStop.stop_sequence)[0];

            if (startStop !== undefined && destinationStop !== undefined) {

                let routeId = this.trips.filter(x => x.trip_id === tripId)[0].route_id;
                linie_trip.set(routeId, [startStop, destinationStop]);
            }
        })
    }


    public async initGtfsData(): Promise<void> {
        
        // agency
        this.agency = this.MapCsv<GtfsClasses.Agency[]>(GtfsClasses.GtfsTypeMap().get("agency"), await this.fetchGtfsData("agency"))[0];

        // calendar_dates
        this.calendar_dates = this.MapCsv<GtfsClasses.CalendarDates[]>(GtfsClasses.GtfsTypeMap().get("calendar_dates"), await this.fetchGtfsData("calendar_dates"));
    
        // feed_info
        this.feed_info = this.MapCsv<GtfsClasses.FeedInfo[]>(GtfsClasses.GtfsTypeMap().get("feed_info"), await this.fetchGtfsData("feed_info"));

        // routes
        this.routes = this.MapCsv<GtfsClasses.Routes[]>(GtfsClasses.GtfsTypeMap().get("routes"), await this.fetchGtfsData("routes"));

        // stops
        this.stops = this.MapCsv<GtfsClasses.Stops[]>(GtfsClasses.GtfsTypeMap().get("stops"), await this.fetchGtfsData("stops"));

        // stop_times
        this.stop_times = this.MapCsv<GtfsClasses.StopTimes[]>(GtfsClasses.GtfsTypeMap().get("stop_times"), await this.fetchGtfsData("stop_times"));

        // trips
        this.trips = this.MapCsv<GtfsClasses.Trips[]>(GtfsClasses.GtfsTypeMap().get("trips"), await this.fetchGtfsData("trips"));
    }


    public fetchGtfsData(dataType: string): Promise<string> {

        return new Promise((resolve, reject) => {

            fetch(`${ url.resolve((<GtfsWidgetSettings>this.WidgetSettings).GtfsBaseAddress, dataType + ".txt") }`)
                .then(res => res.text())
                .then(txt => resolve(txt))
                .catch(err => console.error(err))
        });
    }


    public MapCsv<T>(typeDefinition: any, csvData: string) : T {

        let result: any = [];

        let lines = csvData.split(/\r\n|\n/);
        let headers = lines.splice(0, 1)[0].split(',').map((header) => header.replace(/\"/g, ""));
        
        for (let i = 0; i < lines.length; i++) {
            
            if (lines[i].trim() === "") {

                continue;
            }
            
            let values = lines[i].split(",");

            let obj = {};

            for (let f = 0; f < values.length; f++) {
                
                let parsedValue;

                try {

                    switch (typeDefinition[headers[f]]) {

                        case Boolean:
                            parsedValue = <Boolean>JSON.parse(values[f]);
                            break;
                        case Number:
                            parsedValue = <Number>JSON.parse(values[f]);
                            break;
                        case Date:
                            if (values[f].includes(":")) {
                                
                                parsedValue = new Date();
                                parsedValue.setHours(parseInt(values[f].split(":")[0]));
                                parsedValue.setMinutes(parseInt(values[f].split(":")[1]));
                                parsedValue.setSeconds(parseInt(values[f].split(":")[2]));
                            }
                            else {
                             
                                parsedValue = new Date(`${values[f].substr(4, 2)}.${values[f].substr(6, 2)}.${values[f].substr(0, 4)}`);
                            }    
                            break;
                        default:
                            parsedValue = values[f].replace(/\"/g, "");
                            break;
                    }
                }
                catch (err) {

                    console.error(`Error parsing ${values[f]} as ${typeDefinition[headers[f]]} for header ${headers[f]}`);
                    throw(err);
                }

                Reflect.set(obj, headers[f].replace(/\"/g, ""), parsedValue);           
            }

            result.push(obj);
        }


        console.log(headers);

            
        return result;
    }
    

    private groupBy(list: any[], keyGetter: any) {
        
        const map = new Map();
        list.forEach((item) => {

             const key = keyGetter(item);
             const collection = map.get(key);
             if (!collection) {

                 map.set(key, [item]);
             } else {

                 collection.push(item);
             }
        });
        return map;
    }

    
    private FormatTime(i : number) : string {

        return (i < 10) ? "0" + i.toString() : i.toString();
    }
}

export = (da: Services.DataAdapter, ms: Services.MirrorService) => new Gtfs(da, ms);