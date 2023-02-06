// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import Session from "./Session";

export default class User {
  username: string;
  email: string;
  verified: boolean;
  disabled: boolean;
  firstName: string;
  lastName: string;
  id?: number;
  password?: string;
  sessions?: Session[];

  constructor(
    username: string,
    email: string,
    verified: boolean,
    disabled: boolean,
    firstName: string,
    lastName: string,
    id?: number,
    password?: string,
    sessions?: Session[]
  ) {
    this.username = username;
    this.email = email;
    this.verified = verified;
    this.disabled = disabled;
    this.firstName = firstName;
    this.lastName = lastName;
    this.id = id;
    this.password = password;
    this.sessions = sessions;
  }

  clone(): User {
    return new User(
      this.username,
      this.email,
      this.verified,
      this.disabled,
      this.firstName,
      this.lastName,
      this.id,
      this.password,
      this.sessions === undefined
        ? undefined
        : this.sessions.map((session) => session.clone())
    );
  }
}
