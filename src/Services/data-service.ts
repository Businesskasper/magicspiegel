import * as bettersqlite3 from "better-sqlite3";
import * as fs from "fs";
import * as Model from "../Models";
import { Widget } from "../Widgets/Widget";
import {
  WidgetSettings,
  WidgetSettingsItem,
  WidgetSettingsItemType
} from "../Widgets/WidgetSetting";
import { LoggingService } from "./logging-service";

/*
 * The DataAdapter is our interface to the database. We use a sqlite database (because it's relational and super simple to set up).
 * We use bettersqlite3 since it allows synchronous operations and has much better handling than the sqlite3 package.
 */
export class DataAdapter {
  private Database: bettersqlite3.Database;

  constructor(private logger: LoggingService, private dbpath: string) {
    // this.Database = new bettersqlite3(this.dbpath, {
    //   verbose: (message) => this.logger.Debug(message),
    // });
    this.Database = new bettersqlite3(this.dbpath, {
      verbose: (message) => {}
    });
  }

  // Sets up the database by reading a .sql file
  public InitializeDatabase(databaseSetupPath: string): void {
    this.ExecNonQueryScript(
      fs.readFileSync(databaseSetupPath, { encoding: "utf-8" })
    );
  }

  private ExecNonQueryScript(nonQueryScript: string): void {
    try {
      this.Database.exec(nonQueryScript);
    } catch (err) {
      this.logger.Error(err);
      throw err;
    }
  }

  private ExecNonQuery(nonQuery: string): number {
    try {
      const lastInsertedRowId =
        this.Database.prepare(nonQuery).run().lastInsertRowid;
      return Number(lastInsertedRowId);
    } catch (err) {
      this.logger.Error(err);
      throw err;
    }
  }

  public InsertUser(user: Model.User): void {
    this.logger.Debug(`Inserting ${user.name}`);

    let cmd = "INSERT INTO User (Name, Enabled) ";
    cmd += `SELECT '${user.name}', 1 `;
    cmd += `WHERE NOT EXISTS (SELECT 1 FROM User WHERE Name = '${user.name}')`;

    this.ExecNonQuery(cmd);

    user.descriptors.forEach((descriptor) => {
      this.InsertDescriptor(user.name, descriptor);
    });
  }

  public InsertDescriptor(userName: string, descriptor: Float32Array): void {
    this.logger.Debug(`Inserting ${descriptor}`);

    let cmd = "INSERT INTO Descriptor (DescriptorString, UserName) ";
    cmd += `SELECT '${descriptor.toString()}', '${userName}' `;
    cmd += `WHERE NOT EXISTS (SELECT 1 FROM Descriptor WHERE DescriptorString = '${descriptor.toString()}' AND UserName = '${userName}')`;

    this.ExecNonQuery(cmd);
  }

  public DeleteUser(userName: string) {
    this.logger.Debug(`Deleting user ${userName}`);

    const usersFromDb = this.User(userName);
    if (usersFromDb.length > 0) {
      usersFromDb.forEach((userFromDb) => {
        this.logger.Debug(`Deleting found user ${userFromDb.name}`);
        this.ExecNonQuery(`DELETE FROM User where Name = '${userFromDb.name}'`);
        this.ExecNonQuery(
          `DELETE FROM Descriptor where UserName = '${userFromDb.name}'`
        );
        this.ExecNonQuery(
          `DELETE FROM WidgetSettingValue where UserName = '${userFromDb.name}'`
        );
      });
    }
  }

  public InsertWidget(widget: Widget): void {
    this.logger.Debug(
      `Inserting ${widget.Name} with Version ${widget.Version}`
    );

    let cmd = "INSERT INTO Widget (Name, Version, Description, Author) ";
    cmd += `SELECT '${widget.Name}', ${widget.Version}, '${widget.Description}', '${widget.Author}' `;
    cmd += `WHERE NOT EXISTS (SELECT 1 FROM Widget WHERE Name = '${widget.Name}' AND Version = ${widget.Version})`;

    const widgetId = this.ExecNonQuery(cmd);

    this.InsertWidgetSettingsItems(
      Number(widgetId),
      widget,
      widget.WidgetSettings.WidgetSettingsItems
    );
  }

  public InsertWidgetSettingsItems(
    widgetId: number,
    widget: Widget,
    widgetSettingsItems: WidgetSettingsItem[]
  ) {
    widgetSettingsItems.forEach((widgetSettingsItem: WidgetSettingsItem) => {
      // prettier-ignore
      let cmd = "INSERT INTO WidgetSettingKey (WidgetId, Name, FriendlyName, Description, ReadOnly, Type, Options, PresetValue) ";
      // prettier-ignore
      cmd += `SELECT ${widgetId}, '${widgetSettingsItem.Key}', '${widgetSettingsItem.FriendlyName}', '${widgetSettingsItem.Description}', ${widgetSettingsItem.ReadOnly}, ${widgetSettingsItem.Type}, ${widgetSettingsItem.Options === null ? "NULL" : "'" + widgetSettingsItem.Options + "'"}, ${widgetSettingsItem.PresetValue === null ? "NULL" : "'" + widgetSettingsItem.PresetValue + "'"} `;
      // prettier-ignore
      cmd += `WHERE NOT EXISTS (SELECT 1 FROM WidgetSettingKey INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId WHERE Widget.Name = '${widget.Name}' AND Widget.Version = ${widget.Version} AND WidgetSettingKey.Name = '${widgetSettingsItem.Key}')`;

      this.ExecNonQuery(cmd);
    });
  }

  public InsertWidgetSettings(
    userName: string,
    widgetName: string,
    widgetVersion: number,
    widgetSettings: WidgetSettings
  ) {
    Object.keys(widgetSettings).forEach(
      (settingKey: keyof typeof widgetSettings) => {
        const settingValueId = this.Database.prepare(
          `SELECT WidgetSettingKey.Id FROM WidgetSettingKey
                    INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId
                    WHERE Widget.Name = '${widgetName}' AND Widget.Version = ${widgetVersion} AND WidgetSettingKey.Name = '${settingKey}'`
        ).get();

        if (settingKey !== "WidgetSettingsItems") {
          this.ExecNonQuery(
            `REPLACE INTO WidgetSettingValue (UserName, WidgetSettingId, Value) VALUES ('${userName}', ${settingValueId.Id}, '${widgetSettings[settingKey]}');`
          );
        }
      }
    );
  }

  public FaceDescriptors(userName: string): Float32Array[] {
    return this.Database.prepare(
      `Select DescriptorString FROM Descriptor WHERE UserName = '${userName}'`
    )
      .all()
      .map(
        (result) =>
          new Float32Array(JSON.parse("[" + result.DescriptorString + "]"))
      );
  }

  public User(userName: string): Model.User[] {
    let filter = "";
    if (userName !== null && userName !== undefined && userName.trim() != "") {
      filter = `AND Name = '${userName}'`;
    }

    return this.Database.prepare(
      `Select Name FROM User WHERE Enabled = 1 AND Name IS NOT 'PUBLIC' ${filter}`
    )
      .all()
      .map(({ Name: name }) => {
        const descriptors = this.FaceDescriptors(name);
        return {
          name,
          descriptors,
        };
      });
  }

  public Widget(): Widget[] {
    return this.Database.prepare(
      "Select Name, Version, Description, Author FROM Widget"
    ).all();
  }

  public GetWidgetSettings(
    userName: string,
    widgetName: string,
    widgetVersion: string
  ) {
    return this.Database.prepare(
      `SELECT WidgetSettingValue.UserName, WidgetSettingKey.Name, WidgetSettingKey.Type, WidgetSettingValue.Value FROM WidgetSettingValue
            LEFT JOIN User ON User.Name = WidgetSettingValue.UserName
            JOIN WidgetSettingKey ON WidgetSettingKey.Id = WidgetSettingValue.WidgetSettingId
            INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId
        WHERE User.Name = '${userName}' AND Widget.Name = '${widgetName}' and Widget.Version = ${widgetVersion}`
    )
      .all()
      .reduce(
        (prev, curr) => ({
          ...prev,
          [curr.Name]: this.GetValue(
            <WidgetSettingsItemType>JSON.parse(curr.Type),
            curr.Value
          ),
        }),
        {}
      );
  }

  public GetWidgetSettingsObject<T extends WidgetSettings>(widgetName: string, widgetVersion: string): T {
    let widgetSettingsObject = {
      WidgetSettingsItems: new Array<WidgetSettingsItem>(),
    } as T;

    this.Database.prepare(
      `SELECT WidgetSettingKey.* from WidgetSettingKey 
            INNER JOIN Widget ON Widget.Id = WidgetSettingKey.WidgetId 
        WHERE Widget.Name = '${widgetName}' and Widget.Version = ${widgetVersion}`
    )
      .all()
      .forEach((widgetSettingsItemFromDb) => {
        let description = widgetSettingsItemFromDb.Description;
        if (description?.toString()?.toUpperCase() == "NULL") {
          description = null;
        }

        let options = widgetSettingsItemFromDb.Options;
        if (options?.toString()?.toUpperCase() == "NULL") {
          options = null;
        }

        const presetValue =
          widgetSettingsItemFromDb.PresetValue?.toString()?.toUpperCase() == "NULL"
            ? null
            : this.GetValue(
                widgetSettingsItemFromDb.Type,
                widgetSettingsItemFromDb.PresetValue
              );

        widgetSettingsObject.WidgetSettingsItems.push(
          new WidgetSettingsItem(
            widgetSettingsItemFromDb.Name,
            widgetSettingsItemFromDb.FriendlyName,
            description,
            Boolean(JSON.parse(widgetSettingsItemFromDb.ReadOnly)),
            <WidgetSettingsItemType>JSON.parse(widgetSettingsItemFromDb.Type),
            options,
            presetValue
          )
        );

        widgetSettingsObject = {
          ...widgetSettingsObject,
          [widgetSettingsItemFromDb.Name]: presetValue,
        };
      });

    return widgetSettingsObject;
  }

  private GetValue(
    widgetSettingsItemType: WidgetSettingsItemType,
    valueFromDb: string
  ) {
    if (valueFromDb == "null" || valueFromDb == "Null") {
      return null;
    } else {
      switch (widgetSettingsItemType) {
        case WidgetSettingsItemType.INTEGER: {
          return JSON.parse(valueFromDb);
        }
        case WidgetSettingsItemType.BOOLEAN: {
          return Boolean(JSON.parse(valueFromDb));
        }
        default: {
          return valueFromDb;
        }
      }
    }
  }
}
