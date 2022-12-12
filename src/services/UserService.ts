// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import IUserDao from "src/daos/IUserDao";

export interface FindUsersByUsernamesReturnType {
  username: string;
  verified: boolean;
}

class UserService {
  private userDao: IUserDao;

  constructor(userDao: IUserDao) {
    this.userDao = userDao;
  }

  public async findUsersByUsernames(
    usernames: string[]
  ): Promise<FindUsersByUsernamesReturnType[]> {
    const users = await this.userDao.getUsersByUsernames(usernames);
    return users.filter((user) => user.verified);
  }
}

export default UserService;
