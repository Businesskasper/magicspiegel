import * as Services from "../Services/export";
import { Widget } from "./Widget";
import { WeatherWidgetSettings } from "./Widget_Weather_Settings";

class Weather extends Widget {

    constructor(dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService){
        
        super(
            new WeatherWidgetSettings(), 
            dataAdapter,
            mirrorService, 
            "Wetter", 
            1,
            "Zeigt aktuelle Wetterdaten von OpenWeatherMap.com", 
            "Luka"
        );
    }

    public Load(): void { 

        let containerDiv = document.createElement('div');
        containerDiv.style.flexWrap = "wrap";
        containerDiv.style.display = "flex";

        this.Div.appendChild(containerDiv);
        
        this.fetchWeatherData((<WeatherWidgetSettings>this.WidgetSettings).CityName, (<WeatherWidgetSettings>this.WidgetSettings).OpenWeatherMapApiKey).then((weatherData: WeatherData[]) => {

            //Build Table
            containerDiv.appendChild(
                this.buildTable(weatherData)
            );

        }).catch((err) => {

            console.log(`Weather.Load() -> ${err}`);
        })
    }

    public Refresh(): void {
        
    }

    private async fetchWeatherData(cityName: string, apiKey: string): Promise<WeatherData[]> {
        
        let weatherData = new Array<WeatherData>();

        try {

            let response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`, {method: "GET", headers: {'Content-Type': 'application/json'}});
            let dataSets = await response.json()   

            weatherData = Array.from(dataSets.list).map((dataSet: any) => {

                let day = new WeatherData();
                day.Date = new Date(dataSet.dt_txt);
                day.DayOfWeek = this.getDayOfWeek(day.Date.getDay());
                day.Weather = dataSet.weather[0].main;
                day.WeatherCode = dataSet.weather[0].id;
                day.Temperature = dataSet.main.temp;

                if (dataSet.dt_txt.includes('06:00')) {

                    day.Time = '06:00';
                }
                else if (dataSet.dt_txt.includes('09:00')) {

                    day.Time = '09:00';
                }
                else if (dataSet.dt_txt.includes('12:00')) {

                    day.Time = '12:00';
                }
                else if (dataSet.dt_txt.includes('18:00')) {

                    day.Time = '18:00';
                }
                else if (dataSet.dt_txt.includes('21:00')) {

                    day.Time = '21:00';
                }

                return day;
            })
        }
        catch (err){

            console.error(`Weather.fetchWeatherData() -> ${err}`);
        }
        finally {
            
            return weatherData;
        }
    }

    private buildTable(weatherData: WeatherData[]): HTMLTableElement {
        
        //Build table
        let table: HTMLTableElement = document.createElement('table');
        table.style.fontFamily = "Helvetica";
        table.style.fontSize = "20px";
        table.style.color = "white";

        //Build headers
        let tableRowHeaders = document.createElement('tr');
        table.appendChild(tableRowHeaders);

        let tableHeaderEmpty = document.createElement('th');
        tableHeaderEmpty.style.padding = "3px";
        tableRowHeaders.appendChild(tableHeaderEmpty);


        let groupedWeatherData: Map<string, WeatherData[]> = this.groupBy(weatherData, (weatherDay: WeatherData) => weatherDay.DayOfWeek);
        groupedWeatherData.forEach((weatherDay: WeatherData[]) => {
        
            let dayColumnHeader = document.createElement('th');
            tableRowHeaders.appendChild(dayColumnHeader);
            dayColumnHeader.style.padding = "3px";
            dayColumnHeader.innerHTML = `<p style="margin-right:25px;">${weatherDay[0].DayOfWeek}`;
        })

        //Build table body
        Array.from(["06:00", "09:00", "12:00", "18:00", "21:00"]).forEach(timeValue => {

            //Build time cell
            let tableRow = document.createElement('tr');
            table.appendChild(tableRow);
        
            let tableRowTimeValue = document.createElement('td');
            tableRow.appendChild(tableRowTimeValue);
            tableRowTimeValue.style.padding = "10px";
            tableRowTimeValue.innerText = timeValue;

            //Build value cells
            groupedWeatherData.forEach((weatherDay: WeatherData[]) => {
                
                let tableData = document.createElement('td');
                tableRow.appendChild(tableData);
                tableData.style.padding = "10px";

                weatherDay.forEach((weatherDayValue: WeatherData) => {
                    
                    if (weatherDayValue.Time === timeValue) {

                        tableData.innerHTML = `${this.getWeatherSymbol(weatherDayValue.WeatherCode)}<br>${this.getTemperature(weatherDayValue.Temperature)}°`;  
                    }
                })
            })
        });

        return table;
    }

    private getTemperature (temp: number): string {

        return (Math.round(temp) * 10 / 10).toString();
    }

    private getWeatherSymbol (weatherCode: number): string {
        
        let returnString = "";
        switch(true) { 
            case (weatherCode >= 200 && weatherCode <= 232): { 
               returnString = '<i class="fas fa-bolt"></i>';
               break; 
            }
            case (weatherCode >= 300 && weatherCode <= 501 ): { 
                returnString = '<i class="fas fa-cloud-sun-rain"></i>';
                break; 
            }
            case (weatherCode >= 502 && weatherCode <= 531): { 
                returnString = '<i class="fas fa-cloud-showers-heavy"></i>';
                break; 
            }
            case (weatherCode >= 600 && weatherCode <= 622): { 
                returnString = '<i class="far fa-snowflake"></i>';
                break; 
            }
            case (weatherCode >= 701 && weatherCode <= 781): { 
                returnString = '<i class="fas fa-smog"></i>';
                break; 
            }
            case (weatherCode == 800): { 
                returnString = '<i class="fas fa-sun"></i>';
                break; 
            }
            case (weatherCode == 801): { 
                returnString = '<i class="fas fa-cloud-sun"></i>';
                break; 
            }
            case (weatherCode >= 802 && weatherCode <= 804): { 
                returnString = '<i class="fas fa-cloud"></i>';
                break; 
            }
            default: { 
               //statements; 
               break; 
            } 
        } 

        return returnString;
    }

    private getDayOfWeek(dayNumber : number) : string {
        
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
}


class WeatherData {

    public Date: Date;
    public DayOfWeek: string;
    public Time: string;
    public Weather: Weather;
    public WeatherCode: number;
    public Temperature: number;
}

export = (da: Services.DataAdapter, ms: Services.MirrorService) => new Weather(da, ms);