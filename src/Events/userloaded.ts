import * as Model from "../Models";

/*
 * This is used to identify when a user was loaded. This information is never stored in the database.
 * We need this information because we don't want to refresh a user every few seconds when he walks past the mirror.
 */
export interface UserLoaded {
  userLoadedOn: Date;
  userLoaded: Model.User;
}
