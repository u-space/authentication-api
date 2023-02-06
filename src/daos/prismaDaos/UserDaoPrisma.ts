// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Prisma, PrismaClient } from ".prisma/client";
import User from "src/models/User";
import CorruptedDBError from "../errors/CorruptedDBError";
import NoDataDBError from "../errors/NoDataDBError";
import IUserDao from "../IUserDao";

export default class UserDaoPrisma implements IUserDao {
  prisma = new PrismaClient();

  async getUserByEmail(email: string): Promise<User> {
    const dbUsers = await this.prisma.user.findMany({ where: { email } });
    if (dbUsers.length === 0) {
      throw new NoDataDBError(`There is no user with email '${email}'`);
    } else if (dbUsers.length > 1) {
      throw new CorruptedDBError(
        `There is more than one user with email '${email}'`
      );
    }
    return this.convertPrismaUserToUser(dbUsers[0]);
  }
  async getUserByUsername(username: string): Promise<User> {
    const dbUsers = await this.prisma.user.findMany({ where: { username } });
    if (dbUsers.length === 0) {
      throw new NoDataDBError(`There is no user with username '${username}'`);
    } else if (dbUsers.length > 1) {
      throw new CorruptedDBError(
        `There is more than one user with username '${username}'`
      );
    }
    return this.convertPrismaUserToUser(dbUsers[0]);
  }
  async getUsersByUsernames(usernames: string[]): Promise<User[]> {
    const allUsersInDB = await this.prisma.user.findMany();
    const allUsers = allUsersInDB.map((dbUser) =>
      this.convertPrismaUserToUser(dbUser)
    );
    return allUsers.filter((user) => usernames.includes(user.username));
  }
  async addUser(user: User): Promise<User> {
    const data = {
      username: user.username,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    if (user.id) data["id"] = user.id;
    if (user.verified !== undefined) data["verified"] = user.verified;
    if (user.disabled !== undefined) data["disabled"] = user.disabled;
    const dbUser = await this.prisma.user.create({
      data,
    });
    return this.convertPrismaUserToUser(dbUser);
  }
  async updateUserPassword(username: string, password: string): Promise<User> {
    const dbUser = await this.prisma.user.update({
      data: { password },
      where: { username },
    });
    return this.convertPrismaUserToUser(dbUser);
  }
  async updateUser(user: User): Promise<User> {
    const dbUser = await this.prisma.user.update({
      data: this.convertUserToPrismaUser(user),
      where: { username: user.username },
    });
    return this.convertPrismaUserToUser(dbUser);
  }

  private convertPrismaUserToUser(prismaUser: any): User {
    return new User(
      prismaUser.username,
      prismaUser.email,
      prismaUser.verified,
      prismaUser.disabled,
      prismaUser.firstName,
      prismaUser.lastName,
      prismaUser.id,
      prismaUser.password
    );
  }

  private convertUserToPrismaUser(user: User): any {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      verified: user.verified,
      disabled: user.disabled,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
