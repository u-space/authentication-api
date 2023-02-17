// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NextFunction, Request, Response } from "express";
import DaoFactory, { DaoImplementation } from "../daos/DaoFactory";
import { HttpError } from "../errors/HttpError";
import UserService, {
  FindUsersByUsernamesReturnType,
} from "../services/UserService";

class UserController {
  private userService: UserService;

  constructor(userService?: UserService) {
    this.userService = userService
      ? userService
      : new UserService(new DaoFactory(DaoImplementation.PRISMA).getUserDao());
  }

  public POST_users_by_usernames = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const usernames = req.body.usernames;
      if (!usernames) throw new HttpError(400, "Missing usernames");
      const findAllUsersData: FindUsersByUsernamesReturnType[] =
        await this.userService.findUsersByUsernames(usernames);

      res
        .status(200)
        .json({ data: findAllUsersData, message: "users_by_usernames" });
    } catch (error) {
      next(error);
    }
  };

  public GET_user_by_username = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const username: string = req.params.username;
      if (!username) throw new HttpError(400, "Missing username");
      const findAllUsersData: FindUsersByUsernamesReturnType[] =
        await this.userService.findUsersByUsernames([username]);
      if (findAllUsersData.length === 0) {
        throw new HttpError(
          404,
          `There is no user with the received username [username=${username}]`
        );
      } else if (findAllUsersData.length > 1) {
        throw new HttpError(
          500,
          `There is more than one user with the received username [username=${username}]`
        );
      } else {
        res
          .status(200)
          .json({ data: findAllUsersData[0], message: "user_by_username" });
      }
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
