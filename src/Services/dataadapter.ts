import * as Model from "../Model/export";
import * as bettersqlite3 from 'better-sqlite3';
import * as fs from "fs";
import { Widget } from "../Widgets/Widget";
import { WidgetSettings, WidgetSettingsItem, WidgetSettingsItemType } from "../Widgets/WidgetSetting";
import Integer = require("integer");
import { EventDispatcher, IEvent } from "strongly-typed-events";

/*
* The DataAdapter is our interface to the database. We use a sqlite database (because it's relational and super simple to set up).
* We use bettersqlite3 since it allows synchronous operations and has much better handling than the sqlite3 package.
*/
export class DataAdapter {

    private Database: bettersqlite3.Database;

    // This gets triggered from the frontend if the user updates his profile or the public widgets.
    private widgetSettingsUpdatedEvent = new EventDispatcher<DataAdapter, string>();
    public get onWidgetSettingsUpdatedEvent(): IEvent<DataAdapter, string> {

        console.log(`onWidgetSettingsUpdatedEvent was initiated`)
        return this.widgetSettingsUpdatedEvent.asEvent();
    }


    constructor() {
    }


    // Sets up the database by reading a .sql file
    public InitializeDatabase(databasePath: string, databaseSetupPath: string): void {

        console.log(`InitializeDatabase() -> Setting up db on ${databasePath}`);
        this.Database = new bettersqlite3(databasePath, {verbose: console.log});
        
        this.ExecNonQueryScript(fs.readFileSync(databaseSetupPath, {encoding: 'utf-8'}));
    }


    private ExecNonQueryScript(nonQueryScript: string) : void {

        console.log("DataAdapter.ExecNonQueryScript() -> executing");

        try {

            this.Database.exec(nonQueryScript);
        }
        catch (err) {

            console.error(err);
            throw(err);
        }
        
    }


    private ExecNonQuery (nonQuery: string): Integer.IntLike {
            
        console.log("DataAdapter.ExecNonQuery() -> executing");

        try {
            
            return this.Database.prepare(nonQuery).run().lastInsertRowid.valueOf();
        }
        catch(err) {

            console.error(err);
            throw(err);
        }
    }


    public InsertUser (user: Model.User) : void {

        console.log(`DataAdapter.InsertUser() -> Inserting ${user.Name}`);

        let insertString = "INSERT INTO User (Name, Enabled) ";
        insertString += `SELECT '${user.Name}', 1 `;
        insertString += `WHERE NOT EXISTS (SELECT 1 FROM User WHERE Name = '${user.Name}')`;

        this.ExecNonQuery(insertString)
        user.Descriptors.forEach((descriptor) => {

            this.InsertDescriptor(user.Name, descriptor);
        }) 
    }


    public InsertDescriptor (userName: string, descriptor: Float32Array) : void {

        console.log(`DataAdapter.InsertDescriptor() -> Inserting ${descriptor}`);

        let insertString = "INSERT INTO Descriptor (DescriptorString, UserName) ";
        insertString += `SELECT '${descriptor.toString()}', '${userName}' `;
        insertString += `WHERE NOT EXISTS (SELECT 1 FROM Descriptor WHERE DescriptorString = '${descriptor.toString()}' AND UserName = '${userName}')`;

        this.ExecNonQuery(insertString);
    }


    public DeleteUser (userName: string) {

        console.log(`DataAdapter.Delete(${userName})`);

        let usersFromDb : Model.User[] = this.User(userName);
        if (usersFromDb.length > 0) {

            usersFromDb.forEach((userFromDb) => {

                console.log(`DataAdapter.Delete(${userName}) -> Deleting ${userFromDb.Name}`);
                this.ExecNonQuery(`DELETE FROM User where Name = '${userFromDb.Name}'`);
                this.ExecNonQuery(`DELETE FROM Descriptor where UserName = '${userFromDb.Name}'`)
                this.ExecNonQuery(`DELETE FROM WidgetSettingValue where UserName = '${userFromDb.Name}'`)
            })
        }
    }


    public InsertWidget (widget: Widget) : void {

        console.log(`DataAdapter.InsertWidget() -> Inserting ${widget.Name} on Version ${widget.Version}`);

        let insertString = "INSERT INTO Widget (Name, Version, Description, Author) ";
        insertString += `SELECT '${widget.Name}', ${widget.Version}, '${widget.Description}', '${widget.Author}' `;
        insertString += `WHERE NOT EXISTS (SELECT 1 FROM Widget WHERE Name = '${widget.Name}' AND Version = ${widget.Version})`;

        let widgetId = this.ExecNonQuery(insertString);
        
        this.InsertWidgetSettingsItems((Number)(widgetId), widget, widget.WidgetSettings.WidgetSettingsItems)
    }
    

    public InsertWidgetSettingsItems(widgetId: Integer.IntLike, widget: Widget, widgetSettingsItems: WidgetSettingsItem[]) {

        widgetSettingsItems.forEach((widgetSettingsItem: WidgetSettingsItem) => {

            let insertString = "INSERT INTO WidgetSettingKey (WidgetId, Name, FriendlyName, Description, ReadOnly, Type, Options, PresetValue) ";
            insertString += `SELECT ${widgetId}, '${widgetSettingsItem.Key}', '${widgetSettingsItem.FriendlyName}', '${widgetSettingsItem.Description}', ${widgetSettingsItem.ReadOnly}, ${widgetSettingsItem.Type}, ${widgetSettingsItem.Options === null ? "NULL" : "'"+ widgetSettingsItem.Options + "'"}, ${widgetSettingsItem.PresetValue === null ? "NULL" : "'"+ widgetSettingsItem.PresetValue + "'"} `;
            insertString += `WHERE NOT EXISTS (SELECT 1 FROM WidgetSettingKey INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId WHERE Widget.Name = '${widget.Name}' AND Widget.Version = ${widget.Version} AND WidgetSettingKey.Name = '${widgetSettingsItem.Key}')`

            this.ExecNonQuery(insertString);
        });
    }


    public InsertWidgetSettings(userName: string, widgetName: string, widgetVersion: number, widgetSettings: WidgetSettings) {
            
        Reflect.ownKeys(widgetSettings).forEach((settingKey: string) => {

            let settingValueId = this.Database.prepare(
                `SELECT WidgetSettingKey.Id FROM WidgetSettingKey
                    INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId
                    WHERE Widget.Name = '${widgetName}' AND Widget.Version = ${widgetVersion} AND WidgetSettingKey.Name = '${settingKey}'`
                    ).get();

            if (settingKey !== "WidgetSettingsItems") {
                
                this.ExecNonQuery(`REPLACE INTO WidgetSettingValue (UserName, WidgetSettingId, Value) VALUES ('${userName}', ${settingValueId.Id}, '${Reflect.get(widgetSettings, settingKey)}');`)
            }
        })      
        
        this.widgetSettingsUpdatedEvent.dispatch(this, userName);
    }


    public FaceDescriptors(userName: string): Float32Array[] {

        return this.Database.prepare(`Select DescriptorString FROM Descriptor WHERE UserName = '${userName}'`)
            .all()
            .map(result => new Float32Array(JSON.parse("[" + result.DescriptorString + "]")));
    }


    public User(userName: string) : Model.User[] {        

        let filterText = '';
        if (userName !== null && userName !== undefined && userName.trim() != '') {

            filterText = `AND Name = '${userName}'`;
        }

        return this.Database.prepare(`Select Name FROM User WHERE Enabled = 1 AND Name IS NOT 'PUBLIC' ${filterText}`)
            .all()
            .map(result => new Model.User(result.Name, this.FaceDescriptors(result.Name)));
    }


    public Widget() : Widget[] {
                
        return this.Database.prepare("Select Name, Version, Description, Author FROM Widget").all();
    }


    public GetWidgetSettings(widget: Widget, user: Model.User) {

        let widgetSettingsObject = this.GetWidgetSettingsObject(widget);

        this.Database.prepare(`
            SELECT WidgetSettingValue.UserName, WidgetSettingKey.Name, WidgetSettingKey.Type, WidgetSettingValue.Value FROM WidgetSettingValue
                LEFT JOIN User ON User.Name = WidgetSettingValue.UserName
                INNER JOIN WidgetSettingKey ON WidgetSettingKey.Id = WidgetSettingValue.WidgetSettingId
                INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId
            WHERE User.Name = '${user.Name}' AND Widget.Name = '${widget.Name}' and Widget.Version = ${widget.Version}`
            ).all().forEach((widgetUserSettingDb) => {

                Reflect.set(widgetSettingsObject, widgetUserSettingDb.Name, this.GetValue(<WidgetSettingsItemType>(JSON.parse(widgetUserSettingDb.Type)), widgetUserSettingDb.Value));
        })

        return widgetSettingsObject;
    }


    public GetWidgetSettingsObject<T extends WidgetSettings>(widget: Widget) : T {

        let widgetSettingsObject: T = { WidgetSettingsItems : new Array<WidgetSettingsItem>() } as T;

        this.Database.prepare(
            `SELECT WidgetSettingKey.* from WidgetSettingKey 
                INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId 
                WHERE Widget.Name = '${widget.Name}' and Widget.Version = ${widget.Version}`
            ).all().forEach((widgetSettingsItemFromDb) => {

                let description = widgetSettingsItemFromDb.Description;
                if (description == "null" || description == "NULL") {
                    description = null;
                }

                let options = widgetSettingsItemFromDb.Options;
                if (options == "null" || options == "NULL") {
                    options = null;
                }
                
                let presetValue = null;
                presetValue = widgetSettingsItemFromDb.PresetValue == "null" || widgetSettingsItemFromDb.PresetValue == "NULL"  ?  null : this.GetValue(widgetSettingsItemFromDb.Type, widgetSettingsItemFromDb.PresetValue);

                widgetSettingsObject.WidgetSettingsItems.push(
                    new WidgetSettingsItem(widgetSettingsItemFromDb.Name, widgetSettingsItemFromDb.FriendlyName, description, (Boolean)(JSON.parse(widgetSettingsItemFromDb.ReadOnly)), <WidgetSettingsItemType>(JSON.parse(widgetSettingsItemFromDb.Type)), options, presetValue)
                );
                
                Reflect.set(widgetSettingsObject, widgetSettingsItemFromDb.Name, presetValue);
            })

        return widgetSettingsObject;
    }

    
    private GetValue(widgetSettingsItemType: WidgetSettingsItemType, val: string) {

        let returnValue: any;
        if (val == "null" || val == "Null") {
            
            returnValue = null;
        }
        else {

            switch(widgetSettingsItemType) {
                case WidgetSettingsItemType.INTEGER: {
                    returnValue = JSON.parse(val);
                    break;
                }
                case WidgetSettingsItemType.BOOLEAN: {
                    returnValue = (Boolean)(JSON.parse(val));
                    break;
                }
                default: {
                    returnValue = val;
                    break;
                }
            }
        }

        return returnValue;
    }
}