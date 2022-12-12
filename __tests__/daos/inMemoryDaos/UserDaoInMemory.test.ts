// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import User from "../../../src/models/User";
import DaoFactory, { DaoImplementation } from "../../../src/daos/DaoFactory";
import InvalidDataDBError from "../../../src/daos/errors/InvalidDataDBError";
import IUserDao from "../../../src/daos/IUserDao";
import NoDataDBError from "../../../src/daos/errors/NoDataDBError";

const daoFactory = new DaoFactory(DaoImplementation.IN_MEMORY);

beforeEach(async () => {
  await daoFactory.clearDatabase();
});

// -----------------------------------------------------------
// -------------------------- tests --------------------------
// -----------------------------------------------------------

describe("daos/InMemoryDaos/UserDaoInMemory", () => {
  const userDao = daoFactory.getUserDao();

  test("getUserByEmail", async () => {
    await addJohnDoeUser(userDao);
    await addTomCousinUser(userDao);
    await passNoExistingEmailAndCheckErrorIsThrown(userDao);
    await getUserByEmail(userDao);
  });
  test("getUserByUsername", async () => {
    await addJohnDoeUser(userDao);
    await addTomCousinUser(userDao);
    await passNoExistingUsernameAndCheckErrorIsThrown(userDao);
    await getUserByUsername(userDao);
  });
  test("getUsersByUsernames", async () => {
    await addJohnDoeUser(userDao);
    await addTomCousinUser(userDao);
    await addAnnCruiseUser(userDao);
    await getUsersByUsernames(userDao);
  });
  test("addUser", async () => {
    await addUserWithInvalidUsername(userDao);
    await addUserWithInvalidEmail(userDao);
    await addUserWithInvalidFirstName(userDao);
    await addUserWithInvalidLastName(userDao);
    await addUserWithInvalidPassword(userDao);
    await addTwoUsersWithTheSameUsername(userDao);
    await addTwoUsersWithTheSameEmail(userDao);
    await addValidUserAndVerifyItWasAdded(userDao);
  });
  test("updateUserPassword", async () => {
    await addJohnDoeUser(userDao);
    await updatePasswordOfUnexistingUsernameShouldThrowAnError(userDao);
    await updateWithInvalidPasswordShouldThrowAnError(userDao);
    await updatePasswordAndCheckThatPasswordWasUpdated(userDao);
  });
  test("updateUser", async () => {
    await addJohnDoeUser(userDao);
    await updateWithInvalidValuesShouldThrowAnError(userDao);
    await updateWithValidValuesAnCheckTheUserWasUpdated(userDao);
  });
});

// -----------------------------------------------------------
// ---------------------- aux functions ----------------------
// -----------------------------------------------------------

const updatePasswordOfUnexistingUsernameShouldThrowAnError = async (
  userDao: IUserDao
): Promise<void> => {
  // TODO
};

const updateWithInvalidPasswordShouldThrowAnError = async (
  userDao: IUserDao
): Promise<void> => {
  // TODO
};

const updatePasswordAndCheckThatPasswordWasUpdated = async (
  userDao: IUserDao
): Promise<void> => {
  const username = "johndoe";
  const newPassword = "newPassword1234";
  await userDao.updateUserPassword(username, newPassword);
  const user = await userDao.getUserByUsername(username);
  expect(user.password).toBe(newPassword);
};

const getUsersByUsernames = async (userDao: IUserDao) => {
  const users = await userDao.getUsersByUsernames([
    "aaaaa",
    "johndoe",
    "anncruise",
  ]);
  expect(users.length).toBe(2);
  expect(
    users[0].email === "johndoe@email.com" ||
      users[1].email === "johndoe@email.com"
  ).toBeTruthy();
  expect(
    users[0].email === "anncruise@email.com" ||
      users[1].email === "anncruise@email.com"
  ).toBeTruthy();
};

const passNoExistingEmailAndCheckErrorIsThrown = async (userDao: IUserDao) => {
  await expect(async () => {
    await userDao.getUserByEmail("tomcousin@email.comm");
  }).rejects.toThrow(NoDataDBError);
};

const getUserByEmail = async (userDao: IUserDao) => {
  const user = await userDao.getUserByEmail("tomcousin@email.com");
  expect(user).toEqual(
    new User(
      "tomcousin",
      "tomcousin@email.com",
      true,
      false,
      "Tom",
      "Cousin",
      user.id,
      "abcd"
    )
  );
};

const passNoExistingUsernameAndCheckErrorIsThrown = async (
  userDao: IUserDao
) => {
  await expect(async () => {
    await userDao.getUserByUsername("john_doe");
  }).rejects.toThrow(NoDataDBError);
};

const getUserByUsername = async (userDao: IUserDao) => {
  const user = await userDao.getUserByUsername("johndoe");
  expect(user).toEqual(
    new User(
      "johndoe",
      "johndoe@email.com",
      true,
      false,
      "John",
      "Doe",
      user.id,
      "1234"
    )
  );
};

const addUserWithInvalidUsername = async (userDao: IUserDao) => {
  // user with short username
  await expect(async () => {
    await userDao.addUser(
      new User(
        "",
        "johndoe@email.com",
        false,
        false,
        "John",
        "Doe",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);

  // user with long username
  await expect(async () => {
    await userDao.addUser(
      new User(
        "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
        "johndoe@email.com",
        false,
        false,
        "John",
        "Doe",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);
};

const addUserWithInvalidEmail = async (userDao: IUserDao) => {
  // user with short email
  await expect(async () => {
    await userDao.addUser(
      new User("johndoe", "ab", false, false, "John", "Doe", undefined, "1234")
    );
  }).rejects.toThrow(InvalidDataDBError);

  // user with long email
  await expect(async () => {
    await userDao.addUser(
      new User(
        "johndoe",
        `01234567890123456789012345678901234567890123456789
        01234567890123456789012345678901234567890123456789
        01234567890123456789012345678901234567890123456789
        01234567890123456789012345678901234567890123456789
        01234567890123456789012345678901234567890123456789
        012345`,
        false,
        false,
        "John",
        "Doe",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);
};

const addUserWithInvalidFirstName = async (userDao: IUserDao) => {
  // user with short first name
  await expect(async () => {
    await userDao.addUser(
      new User(
        "johndoe",
        "johndoe@email.com",
        false,
        false,
        "",
        "Doe",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);

  // user with long first name
  await expect(async () => {
    await userDao.addUser(
      new User(
        "johndoe",
        "johndoe@email.com",
        false,
        false,
        "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
        "Doe",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);
};

const addUserWithInvalidLastName = async (userDao: IUserDao) => {
  // user with short last name
  await expect(async () => {
    await userDao.addUser(
      new User(
        "johndoe",
        "johndoe@email.com",
        false,
        false,
        "John",
        "",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);

  // user with long last name
  await expect(async () => {
    await userDao.addUser(
      new User(
        "johndoe",
        "johndoe@email.com",
        false,
        false,
        "John",
        "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
        undefined,
        "1234"
      )
    );
  }).rejects.toThrow(InvalidDataDBError);
};

const addUserWithInvalidPassword = async (userDao: IUserDao) => {
  // TODO
};

const addTwoUsersWithTheSameUsername = async (userDao: IUserDao) => {
  // TODO
};

const addTwoUsersWithTheSameEmail = async (userDao: IUserDao) => {
  // TODO
};

const addValidUserAndVerifyItWasAdded = async (userDao: IUserDao) => {
  // user with valid data
  const userAdded = await userDao.addUser(
    new User(
      "johndoe",
      "johndoe@email.com",
      false,
      false,
      "John",
      "Doe",
      undefined,
      "1234"
    )
  );
  expect(userAdded).toEqual(
    new User(
      "johndoe",
      "johndoe@email.com",
      false,
      false,
      "John",
      "Doe",
      userAdded.id,
      "1234"
    )
  );
};

const addJohnDoeUser = async (userDao: IUserDao): Promise<void> => {
  await userDao.addUser(
    new User(
      "johndoe",
      "johndoe@email.com",
      true,
      false,
      "John",
      "Doe",
      undefined,
      "1234"
    )
  );
};

const addTomCousinUser = async (userDao: IUserDao): Promise<void> => {
  await userDao.addUser(
    new User(
      "tomcousin",
      "tomcousin@email.com",
      true,
      false,
      "Tom",
      "Cousin",
      undefined,
      "abcd"
    )
  );
};

const addAnnCruiseUser = async (userDao: IUserDao): Promise<void> => {
  await userDao.addUser(
    new User(
      "anncruise",
      "anncruise@email.com",
      true,
      false,
      "Ann",
      "Cruise",
      undefined,
      "1b3d"
    )
  );
};

const updateWithInvalidValuesShouldThrowAnError = async (
  userDao: IUserDao
): Promise<void> => {
  // TODO
};

const updateWithValidValuesAnCheckTheUserWasUpdated = async (
  userDao: IUserDao
): Promise<void> => {
  const username = "johndoe";
  const user = await userDao.getUserByUsername(username);
  const newUsername = "rickbolt";
  const userWithUpdatedValues = new User(
    newUsername,
    "rickbolt@email.com",
    true,
    false,
    "Rick",
    "Bolt",
    user.id,
    "1rickboltpassword2"
  );
  await userDao.updateUser(userWithUpdatedValues);
  const userUpdatedFromDB = await userDao.getUserByUsername(newUsername);
  expect(userUpdatedFromDB).toEqual(userWithUpdatedValues);
};
