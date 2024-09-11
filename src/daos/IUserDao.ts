// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import User from '../models/User';

export default interface IUserDao {
  getUserByEmail(email: string): Promise<User>;
  getUserByUsername(username: string): Promise<User>;
  getUsersByUsernames(usernames: string[]): Promise<User[]>;
  addUser(user: User): Promise<User>;
  updateUserPassword(username: string, password: string): Promise<User>;
  updateUser(username: string, user: User): Promise<User>;
}
