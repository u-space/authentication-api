// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import User from "src/models/User";
import IUserDao from "../IUserDao";

export default class UserDaoPrisma implements IUserDao {
  getUserByEmail(email: string): Promise<User> {
    throw new Error("Method not implemented.");
  }
  getUserByUsername(username: string): Promise<User> {
    throw new Error("Method not implemented.");
  }
  getUsersByUsernames(usernames: string[]): Promise<User[]> {
    throw new Error("Method not implemented.");
  }
  addUser(user: User): Promise<User> {
    throw new Error("Method not implemented.");
  }
  updateUserPassword(username: string, password: string): Promise<User> {
    throw new Error("Method not implemented.");
  }
  updateUser(user: User): Promise<User> {
    throw new Error("Method not implemented.");
  }
}
