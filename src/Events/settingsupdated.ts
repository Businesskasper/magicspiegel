
/*
 * Event payload for when a users settings were updated from the frontend
 */
export interface UserUpdated {
  userName: string;
}

export const UserUpdatedToken = 'UserUpdated';