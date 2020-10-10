import * as Services from "../Services/export";
import { Widget } from "./Widget";
import { TodoistWidgetSettings } from "./Widget_Todoist_Settings";

class Todoist extends Widget {

    constructor(dataAdapter: Services.DataAdapter, mirrorService: Services.MirrorService){
        
        super(
            new TodoistWidgetSettings(), 
            dataAdapter,
            mirrorService, 
            "Todoist", 
            1,
            "Zeigt Listen von Todoist.com", 
            "Luka"
        );
    }

    public Load(): void {
        
        this.Div.style.fontFamily = "Helvetica";
        this.Div.style.fontSize = "20px";
        this.Div.style.color = "white";
        
        this.showWidget((<TodoistWidgetSettings>this.WidgetSettings).Project, (<TodoistWidgetSettings>this.WidgetSettings).ApiKey);
    }


    public Refresh(): void {
        
        this.showWidget((<TodoistWidgetSettings>this.WidgetSettings).Project, (<TodoistWidgetSettings>this.WidgetSettings).ApiKey);
    }


    private showWidget(project: string, apiKey: string): void {

        this.Div.innerHTML = "";
        
        this.fetchTasks(project, apiKey).then((tasks: any) => {

            let header = document.createElement('span');
            header.innerHTML = `<h3><i class="fas fa-tasks"></i> ${project}</h3>`
            this.Div.appendChild(header);

            let taskSpanMap: Map<string, HTMLSpanElement> = new Map<string, HTMLSpanElement>();
            taskSpanMap.set("undefined", document.createElement('span'));
            this.Div.appendChild(taskSpanMap.get("undefined"));

            for (let index = 0; index < tasks.length; index++) {

                let indentCount = this.getIndent(0, tasks, tasks[index].id);

                taskSpanMap.set(tasks[index].id, document.createElement('span'));
                let htmlText = '<div>';
                for (let i = 0; i < indentCount; i++) {

                    htmlText += '&nbsp;&nbsp;&nbsp;'
                }


                if (tasks[index].due !== undefined) {

                    let dueDate: Date = new Date(tasks[index].due.date);
                    
                    if (dueDate < new Date()) {

                        htmlText += `<i class="far fa-square"></i>&nbsp;<i style="font-style: normal; text-decoration: underline;">${tasks[index].content}!!!</i>`;
                    }
                    else {

                        htmlText += `<i class="far fa-square"></i>&nbsp;<i style="font-style: normal;">${tasks[index].content}</i>`;
                    }

                    htmlText += `&nbsp;&nbsp;&nbsp;<i style="font-size: 13px; font-style: normal;">${ this.GetWeekDay(dueDate.getDay()) + " " + this.FormatTime(dueDate.getDate()) + "." + this.FormatTime(dueDate.getMonth() + 1) + "." + dueDate.getFullYear() }</i>`;
                }
                else {

                    htmlText += `<i class="far fa-square"></i>&nbsp;<i style="font-style: normal;">${tasks[index].content}</i>`;
                }

                htmlText += '<br></div>';
                taskSpanMap.get(tasks[index].id).innerHTML = htmlText;
        
                taskSpanMap.get(tasks[index].parent_id).appendChild(taskSpanMap.get(tasks[index].id));
            }
        })
    }


    private async fetchTasks(projectName: string, apiKey: string): Promise<any> {
        
        let returnValue: any;

        try {

            let projects = await this.get('https://api.todoist.com/rest/v1/projects', {'Authorization': `Bearer ${apiKey}`})

            for (let index = 0; index < projects.length; index++) {

                if (projects[index].name == projectName) {
                    
                    returnValue = await this.get(`https://api.todoist.com/rest/v1/tasks?project_id=${projects[index].id}`, {'Authorization': `Bearer ${apiKey}`});
                    returnValue.forEach((element: any) => {
                        
                        if (!element.hasOwnProperty("parent_id")) {

                            Reflect.set(element, "parent_id", "undefined");
                        }
                    });
                } 
            }
        }
        catch (err) {

            console.error(`Todoist.fetchProject() -> ${err}`);
        }
        finally {

            return returnValue;
        }
    }


    private getIndent(startIndex: number, tasks: any[], taskId: any): number {

        let task: any = tasks.filter(x => x.id === taskId)[0];

        if (task.parent_id !== "undefined") {

            startIndex++;
            startIndex += this.getIndent(startIndex, tasks, task.parent_id);
        }

        return startIndex;
    }

    private FormatTime(i : number) : string {

        return (i < 10) ? "0" + i.toString() : i.toString();
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


    private async get(uri: string, headers: any): Promise<any> {

        let returnValue: any;

        try {

            let response = await fetch(uri, {method: "GET", headers: headers});
            returnValue = await response.json()   
        }
        catch (err) {

            console.error(`Todoist.get() -> ${err}`);
        }
        finally {

            return returnValue;
        }
    }
}

export = (da: Services.DataAdapter, ms: Services.MirrorService) => new Todoist(da, ms);