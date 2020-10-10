import * as Model from "./export";

/*
* This is used to identify when a user was loaded. This information is never stored in the database.
* We need this information because we don't want to refresh a user every few seconds when he walks past the mirror.
*/
export class UserLoaded {

    public UserLoadedOn : Date;
    public UserLoaded : Model.User;

    constructor(userLoadedOn: Date = new Date(), userLoaded: Model.User = new Model.User()) {

        this.UserLoadedOn = userLoadedOn;
        this.UserLoaded = userLoaded;
    }
}