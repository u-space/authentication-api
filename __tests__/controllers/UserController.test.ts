// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { getMockReq, getMockRes } from "@jest-mock/express";
import { hash } from "bcrypt";
import DaoFactory, { DaoImplementation } from "../../src/daos/DaoFactory";
import User from "../../src/models/User";
import UserController from "../../src/controllers/UserController";
import UserService from "../../src/services/UserService";

const { res, mockClear, next } = getMockRes();

const daoFactory = new DaoFactory(DaoImplementation.IN_MEMORY);

beforeEach(async () => {
  mockClear();
  const userDao = daoFactory.getUserDao();
  await userDao.addUser(
    new User(
      "johndoe",
      "johndoe@email.com",
      true,
      false,
      "John",
      "Doe",
      undefined,
      await hash("john1234", 10)
    )
  );
  await userDao.addUser(
    new User(
      "unverified",
      "unverified@email.com",
      false,
      true,
      "Unverified",
      "User",
      undefined,
      await hash("unverified1234", 10)
    )
  );
  await userDao.addUser(
    new User(
      "disableduser",
      "disableduser@email.com",
      true,
      true,
      "Disabled",
      "User",
      undefined,
      await hash("disableduser1234", 10)
    )
  );
});

afterEach(async () => {
  await daoFactory.clearDatabase();
});

describe("controllers/UserController", () => {
  const userDao = daoFactory.getUserDao();
  const userService = new UserService(userDao);
  const userController = new UserController(userService);
  test("GET_user_by_username", async () => {
    const req = getMockReq({
      params: {
        username: "johndoe",
      },
    });
    await userController.GET_user_by_username(req, res, next);
  });
  test("POST_users_by_usernames", async () => {});
});
