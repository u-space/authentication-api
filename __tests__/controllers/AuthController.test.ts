// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { getMockReq, getMockRes } from "@jest-mock/express";
import AuthService from "../../src/services/AuthService";
import AuthController from "../../src/controllers/AuthController";
import DaoFactory, { DaoImplementation } from "../../src/daos/DaoFactory";
import User from "../../src/models/User";
import { hash } from "bcrypt";
import IUserDao from "src/daos/IUserDao";

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

describe("controllers/AuthController", () => {
  const daoFactory = new DaoFactory(DaoImplementation.IN_MEMORY);
  const userDao = daoFactory.getUserDao();
  const sessionDao = daoFactory.getSessionDao();
  const authService = new AuthService(userDao, sessionDao);
  const authController = new AuthController(authService);

  test("POST_login", async () => {
    await sendInvalidRequestAndCheckResponseStatusIsHTTP400(authController);
    await sendNonExistingUsernameAndCheckResponseStatusIsHTTP404(
      authController
    );
    await tryToLoginWithNoVerifiedUserAndCheckResponseStatusIsHTTP400(
      authController
    );
    await tryToLoginWithDisabledUserAndCheckResponseStatusIsHTTP400(
      authController
    );
    await tryToLoginWithWrongPasswordAndCheckResponseStatusIsHTTP404(
      authController
    );
    await loginWithValidUserAndCheckResponseIsOk(authController);
  });
  test("POST_login_session", () => {});
  test("POST_signup", () => {});
  test("POST_signup_magic", () => {});
  test("PUT_password", async () => {
    await sendInvalidRequestAndCheckResponseStatusIsHTTP400_PUT_password(
      authController
    );
    await sendNonExistingUsernameAndCheckResponseStatusIsHTTP404_PUT_password(
      authController
    );
    await tryToUpdatePasswordOfNoVerifiedUserAndCheckResponseStatusIsHTTP400(
      authController
    );
    await tryToUpdatePasswordOfDisabledUserAndCheckResponseStatusIsHTTP400(
      authController
    );
    await tryToUpdatePasswordWithInvalidPasswordAndCheckResponseStatusIsHTTP400(
      authController
    );
    await updatePasswordAndCheckThePasswordWasUpdated(authController, userDao);
  });
  test("PUT_update", () => {});
});

// -----------------------------------------------------------
// ---------------------- aux functions ----------------------
// -----------------------------------------------------------

const sendInvalidRequestAndCheckResponseStatusIsHTTP400 = async (
  authController: AuthController
) => {
  let req = getMockReq({
    body: {},
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
  req = getMockReq({
    body: {
      username: "johndoe",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
  req = getMockReq({
    body: {
      username: "johndoe",
      password: "john1234",
      anotherProperty: "some value",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
};

const sendNonExistingUsernameAndCheckResponseStatusIsHTTP404 = async (
  authController: AuthController
) => {
  const req = getMockReq({
    body: {
      username: "johndoe2",
      password: "john1234",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(404);
  mockClear();
};

const tryToLoginWithNoVerifiedUserAndCheckResponseStatusIsHTTP400 = async (
  authController: AuthController
) => {
  const req = getMockReq({
    body: {
      username: "unverified",
      password: "unverified1234",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
};

const tryToLoginWithDisabledUserAndCheckResponseStatusIsHTTP400 = async (
  authController: AuthController
) => {
  const req = getMockReq({
    body: {
      username: "disableduser",
      password: "disableduser1234",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
};

const tryToLoginWithWrongPasswordAndCheckResponseStatusIsHTTP404 = async (
  authController: AuthController
) => {
  const req = getMockReq({
    body: {
      username: "johndoe",
      password: "john12345",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(404);
  mockClear();
};

const loginWithValidUserAndCheckResponseIsOk = async (
  authController: AuthController
) => {
  const req = getMockReq({
    body: {
      username: "johndoe",
      password: "john1234",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(200);
  mockClear();
};

const sendInvalidRequestAndCheckResponseStatusIsHTTP400_PUT_password = async (
  authController: AuthController
) => {
  let req = getMockReq({
    body: {},
  });
  await authController.PUT_password(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
  req = getMockReq({
    body: {
      username: "johndoe",
    },
  });
  await authController.PUT_password(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
  req = getMockReq({
    body: {
      username: "johndoe",
      password: "john12345",
      anotherProperty: "some value",
    },
  });
  await authController.PUT_password(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
};

const sendNonExistingUsernameAndCheckResponseStatusIsHTTP404_PUT_password =
  async (authController: AuthController) => {
    const req = getMockReq({
      body: {
        username: "johndoe2",
        password: "john12345",
      },
    });
    await authController.PUT_password(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    mockClear();
  };

const tryToUpdatePasswordOfNoVerifiedUserAndCheckResponseStatusIsHTTP400 =
  async (authController: AuthController) => {
    const req = getMockReq({
      body: {
        username: "unverified",
        password: "newpassword",
      },
    });
    await authController.PUT_password(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    mockClear();
  };

const tryToUpdatePasswordOfDisabledUserAndCheckResponseStatusIsHTTP400 = async (
  authController: AuthController
) => {
  const req = getMockReq({
    body: {
      username: "disableduser",
      password: "newpassword",
    },
  });
  await authController.PUT_password(req, res, next);
  expect(res.status).toHaveBeenCalledWith(400);
  mockClear();
};

const tryToUpdatePasswordWithInvalidPasswordAndCheckResponseStatusIsHTTP400 =
  async (authController: AuthController) => {
    // password should have from 8 to 64 characters
    let req = getMockReq({
      body: {
        username: "johndoe",
        password: "1234567",
      },
    });
    await authController.PUT_password(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    mockClear();
    req = getMockReq({
      body: {
        username: "johndoe",
        password:
          "12345678901234567890123456789012345678901234567890123456789012345",
      },
    });
    await authController.PUT_password(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    mockClear();
  };

const updatePasswordAndCheckThePasswordWasUpdated = async (
  authController: AuthController,
  userDao: IUserDao
) => {
  const username = "johndoe";
  const password = "somenewpassword";
  let req = getMockReq({
    body: {
      username,
      password,
    },
  });
  await authController.PUT_password(req, res, next);
  expect(res.status).toHaveBeenCalledWith(200);
  mockClear();
  req = getMockReq({
    body: {
      username,
      password: "john1234",
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(404);
  mockClear();
  req = getMockReq({
    body: {
      username,
      password,
    },
  });
  await authController.POST_login(req, res, next);
  expect(res.status).toHaveBeenCalledWith(200);
  mockClear();
};
