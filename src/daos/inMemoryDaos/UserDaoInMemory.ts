// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import User from '../../models/User';
import AlraedyDataDBError from '../errors/AlreadyDataDBError';
import CorruptedDBError from '../errors/CorruptedDBError';
import NoDataDBError from '../errors/NoDataDBError';
import UnexpectedDBError from '../errors/UnexpectedDBError';
import IUserDao from '../IUserDao';
import ValidatorUtil from '../utils/ValidatorUtil';
import InMemoryDB from './InMemoryDB';

export default class UserDaoInMemory implements IUserDao {
  async getUserByEmail(email: string): Promise<User> {
    const filteredUsers = InMemoryDB.getUsers().filter(
      (user) => user.email === email
    );
    if (filteredUsers.length === 0)
      throw new NoDataDBError(`There is no user with the email '${email}'`);
    if (filteredUsers.length > 1)
      throw new CorruptedDBError(
        `There are ${filteredUsers.length} users with the email '${email}'`
      );
    return Promise.resolve(filteredUsers[0]);
  }

  async getUserByUsername(username: string): Promise<User> {
    const filteredUsers = InMemoryDB.getUsers().filter(
      (user) => user.username === username
    );
    if (filteredUsers.length === 0)
      throw new NoDataDBError(
        `There is no user with the username '${username}'`
      );
    if (filteredUsers.length > 1)
      throw new CorruptedDBError(
        `There are ${filteredUsers.length} users with the username '${username}'`
      );
    return Promise.resolve(filteredUsers[0]);
  }

  async getUsersByUsernames(usernames: string[]): Promise<User[]> {
    const result = InMemoryDB.getUsers().filter((user) =>
      usernames.includes(user.username)
    );
    return Promise.resolve(result);
  }

  async addUser(user: User): Promise<User> {
    ValidatorUtil.validateUser(user);
    try {
      await this.getUserByEmail(user.email);
      throw new AlraedyDataDBError(
        `There is a user with the email '${user.email}'`
      );
    } catch (error) {}
    try {
      await this.getUserByUsername(user.username);
      throw new AlraedyDataDBError(
        `There is a user with the username '${user.username}'`
      );
    } catch (error) {}
    return Promise.resolve(InMemoryDB.addUser(user));
  }

  async updateUserPassword(username: string, password: string): Promise<User> {
    const user = await this.getUserByUsername(username);
    user.password = password;
    let dbUser: User;
    try {
      dbUser = InMemoryDB.updateUser(user);
    } catch (error) {
      try {
        if ((error as Error).message === 'NO_DATA')
          throw new NoDataDBError(
            `There is no user with the username '${username}'`
          );
        else if ((error as Error).message === 'CORRUPTED_DB')
          throw new CorruptedDBError(`Corrupted db`);
      } catch (_ignored) {}
      throw new UnexpectedDBError(
        `UnexpectedDBError updating user password`,
        error instanceof Error ? error : undefined
      );
    }
    return Promise.resolve(dbUser);
  }

  async updateUser(username: string, user: User): Promise<User> {
    try {
      return Promise.resolve(InMemoryDB.updateUser(user));
    } catch (error) {
      try {
        if ((error as Error).message === 'NO_DATA')
          throw new NoDataDBError(`There is no user with the id '${user.id}'`);
        else if ((error as Error).message === 'CORRUPTED_DB')
          throw new CorruptedDBError(`Corrupted db`);
      } catch (_ignored) {}
      throw new UnexpectedDBError(
        `UnexpectedDBError updating user`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
