// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import Session from "../../models/Session";
import User from "../../models/User";

export default class InMemoryDB {
  static nextSessionId = 1;
  static nextUserId = 1;
  static users: User[] = [];
  static sessions: Session[] = [];

  static clearDB() {
    this.users = [];
  }

  static addUser = (user: User): User => {
    const userToAdd = user.clone();
    userToAdd.id = this.nextUserId++;
    this.users.push(userToAdd);
    return userToAdd.clone();
  };

  static getUsers = (): User[] => {
    const result = [];
    for (let i = 0; i < this.users.length; i++) {
      result.push(this.users[i].clone());
    }
    return result;
  };

  static updateUser = (user: User): User => {
    // put this line just be notified if the User class changes
    // in that case, we have to update this code
    new User(
      "username",
      "email",
      false,
      false,
      "firstName",
      "lastName",
      1,
      "password"
    );

    const filteredUsers = this.users.filter((u) => u.id === user.id);
    if (filteredUsers.length === 0) throw new Error("NO_DATA");
    else if (filteredUsers.length > 1) throw new Error("CORRUPTED_DB");
    filteredUsers[0].username = user.username;
    filteredUsers[0].email = user.email;
    filteredUsers[0].verified = user.verified;
    filteredUsers[0].disabled = user.disabled;
    filteredUsers[0].firstName = user.firstName;
    filteredUsers[0].lastName = user.lastName;
    filteredUsers[0].password = user.password;
    return filteredUsers[0].clone();
  };

  static addSession = (session: Session): Promise<Session> => {
    const sessionToAdd = session.clone();
    sessionToAdd.id = this.nextSessionId;
    this.sessions.push(sessionToAdd);
    return Promise.resolve(sessionToAdd.clone());
  };

  static deleteSession = (sessionId: number): void => {
    let index = -1;
    for (let i = 0; i < InMemoryDB.sessions.length; i++) {
      if (InMemoryDB.sessions[i].id === sessionId) {
        index = i;
        break;
      }
    }
    if (index === -1) throw new Error("NO_DATA");
    delete InMemoryDB.sessions[index];
  };

  static getSessions = (): Session[] => {
    return InMemoryDB.sessions.map((session) => session.clone());
  };
}
