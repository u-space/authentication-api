// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { HttpError } from "../errors/HttpError";
import fs from "fs";
import AuthUtil from "../utils/AuthUtil";
import ISessionDao from "src/daos/ISessionDao";
import IUserDao from "src/daos/IUserDao";
import User from "../../src/models/User";
import Session from "../../src/models/Session";
import NoDataError from "./errors/NoDataError";
import NoDataDBError from "../../src/daos/errors/NoDataDBError";
import InvalidDataError from "./errors/InvalidDataError";
import AlreadyDataError from "./errors/AlreadyDataError";

function cleanUser(user: User) {
  const result = user.clone();
  result.password = undefined;
  return result;
}

class AuthService {
  private userDao: IUserDao;
  private sessionDao: ISessionDao;

  constructor(userDao: IUserDao, sessionDao: ISessionDao) {
    this.userDao = userDao;
    this.sessionDao = sessionDao;
  }

  private async cleanOldUserSessions(user: User, all = false) {
    const sessions = user.sessions;
    if (sessions) {
      await Promise.all(
        sessions.map(async (session) => {
          if (
            all ||
            AuthUtil.decodeToken(session.refreshToken).expirationDate <
              new Date()
          ) {
            await this.sessionDao.deleteSession(session.id);
          }
        })
      );
    }
  }

  private convertExtraDataFromObjectToMap(
    extraData: object
  ): Map<string, string> {
    const result = new Map<string, string>();
    const keys = Object.keys(extraData);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (typeof extraData[key] !== "string") {
        throw new InvalidDataError(
          `in extraData, '${key}' value should be a string`
        );
      }
      result.set(key, extraData[key]);
    }
    return result;
  }

  private async verifyUserDoesNotExist(username: string, email: string) {
    // verify there is no user with the email received
    try {
      await this.userDao.getUserByEmail(email);
      throw new AlreadyDataError(`The email ${email} is already registered`);
    } catch (error) {
      if (!(error instanceof NoDataDBError)) throw error;
    }

    // verify there is no user with the username received
    try {
      await this.userDao.getUserByUsername(username);
      throw new AlreadyDataError(
        `The username ${username} is already registered`
      );
    } catch (error) {
      if (!(error instanceof NoDataDBError)) throw error;
    }
  }

  public async signup(userData: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    verified?: boolean;
  }): Promise<User> {
    const { username, email, password, verified } = userData;
    await this.verifyUserDoesNotExist(username, email);
    const hashedPassword = await hash(password, 10);
    return await this.userDao.addUser(
      new User(
        userData.username,
        userData.email,
        verified ?? false,
        false,
        userData.firstName,
        userData.lastName,
        undefined,
        hashedPassword
      )
    );
  }

  public async signupMagic(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    extraData: object;
  }): Promise<{ user: User; accessToken: string }> {
    const { username, email, extraData } = userData;
    delete userData.extraData;
    await this.verifyUserDoesNotExist(username, email);
    let mapExtraData: Map<string, string>;
    if (extraData !== undefined) {
      mapExtraData = this.convertExtraDataFromObjectToMap(extraData);
    }

    const user = await this.userDao.addUser(
      new User(
        userData.username,
        userData.email,
        true,
        false,
        userData.firstName,
        userData.lastName
      )
    );
    const accessToken = this.createToken(user, mapExtraData);
    return { accessToken, user };
  }

  public async updatePassword(
    username: string,
    password: string
  ): Promise<User> {
    let user: User;
    try {
      user = await this.userDao.getUserByUsername(username);
    } catch (error) {
      if (error instanceof NoDataDBError) {
        throw new NoDataError("there is no user with the username received");
      }
      throw error;
    }
    if (!user.verified) {
      throw new InvalidDataError("the user is not verified");
    }
    if (user.disabled) {
      throw new InvalidDataError("the user is disabled");
    }
    const sessions = await this.sessionDao.getSessionsByUserId(user.id);
    user.sessions = sessions;
    await this.cleanOldUserSessions(user, true);
    const hashedPassword = await hash(password, 10);
    const userFromDB = await this.userDao.updateUserPassword(
      username,
      hashedPassword
    );
    const userSessions = await this.sessionDao.getSessionsByUserId(
      userFromDB.id
    );
    userFromDB.sessions = userSessions;
    return Promise.resolve(userFromDB);
  }

  public async updateUser(data: User): Promise<User> {
    const { username } = data;
    const newData = { ...data, username: undefined, password: undefined };
    const user = await this.userDao.getUserByUsername(username);
    if (!user)
      throw new HttpError(
        404,
        `The user with username ${username} does not exist`
      );
    return await this.userDao.updateUser(
      new User(
        username,
        newData.email,
        true,
        user.verified,
        newData.firstName,
        newData.lastName,
        user.id,
        undefined
      )
    );
  }

  public async login(userData: {
    username: string;
    password: string;
    extraData: object;
  }): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    let foundUser: User;
    try {
      foundUser = await this.userDao.getUserByUsername(userData.username);
    } catch (error) {
      if (error instanceof NoDataDBError) {
        throw new NoDataError(
          "there is no user with the username received",
          error
        );
      }
      throw error;
    }
    const sessions = await this.sessionDao.getSessionsByUserId(foundUser.id);
    foundUser.sessions = sessions;
    if (!foundUser)
      throw new NoDataError("there is no user with the username received");
    if (!foundUser.password) throw new InvalidDataError("password is not set"); // Password needs to be reset
    if (foundUser.disabled) throw new InvalidDataError("user is disabled");

    const isPasswordMatching = await compare(
      userData.password,
      foundUser.password
    );
    if (!isPasswordMatching) throw new NoDataError("password is incorrect");

    if (!foundUser.verified)
      throw new InvalidDataError("the user is not verified");

    await this.cleanOldUserSessions(foundUser);

    let mapExtraData: Map<string, string>;
    if (userData.extraData !== undefined) {
      mapExtraData = this.convertExtraDataFromObjectToMap(userData.extraData);
    }
    const accessToken = this.createToken(foundUser, mapExtraData);
    const refreshToken = await this.createRefreshToken(foundUser);

    return { accessToken, refreshToken, user: cleanUser(foundUser) };
  }

  public async loginByRefreshToken(
    publicKey: string,
    userSession: {
      username: string;
      refresh_token: string;
      extraData: object;
    }
  ): Promise<{ accessToken: string; user: User }> {
    const tokenVerification = AuthUtil.verifyToken(
      userSession.refresh_token,
      publicKey
    );
    if (tokenVerification.username !== userSession.username)
      throw new HttpError(409, "Username does not match refresh token");

    const foundUser = await this.userDao.getUserByUsername(
      userSession.username
    );
    let sessions = await this.sessionDao.getSessionsByUserId(foundUser.id);
    sessions = sessions.filter(
      (session) => session.refreshToken === userSession.refresh_token
    );
    foundUser.sessions = sessions;

    if (!foundUser)
      throw new HttpError(409, "Username or refresh token is incorrect");
    if (foundUser.disabled) throw new HttpError(409, "User is disabled");
    if (!foundUser.verified)
      throw new HttpError(401, "The user is not verified");
    if (foundUser.sessions.length === 0)
      throw new HttpError(401, "The session has been finished");
    await this.cleanOldUserSessions(foundUser);

    let mapExtraData: Map<string, string>;
    if (userSession.extraData !== undefined) {
      mapExtraData = this.convertExtraDataFromObjectToMap(
        userSession.extraData
      );
    }

    const accessToken = this.createToken(foundUser, mapExtraData);
    return { accessToken: accessToken, user: cleanUser(foundUser) };
  }

  public createToken(user: User, extraData?: Map<string, string>): string {
    const dataStoredInToken = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    if (extraData) {
      for (let key of extraData.keys()) {
        dataStoredInToken[key] = extraData.get(key);
      }
    }
    const privateKey = fs.readFileSync("./private.key", "utf8");
    const expiresInSeconds: number = 60 * 60;

    return AuthUtil.createToken(
      dataStoredInToken,
      expiresInSeconds,
      privateKey
    );
  }

  public async createRefreshToken(user: User): Promise<string> {
    const dataStoredInToken = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    const privateKey = fs.readFileSync("./private.key", "utf8");
    const expiresIn = "1 week";
    const refreshToken = sign(dataStoredInToken, privateKey, {
      expiresIn,
      algorithm: "RS256",
    });
    await this.sessionDao.addSession(new Session(-1, user.id, refreshToken));
    return refreshToken;
  }
}

export default AuthService;
