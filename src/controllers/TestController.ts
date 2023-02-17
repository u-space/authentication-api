import { PrismaClient } from ".prisma/client";
import { NextFunction, Request, Response } from "express";
import IUserDao from "../daos/IUserDao";
import UserDaoPrisma from "../daos/prismaDaos/UserDaoPrisma";
import User from "../models/User";
import fs from "fs";
import AuthUtil from "../utils/AuthUtil";
import ISessionDao from "../daos/ISessionDao";
import SessionDaoPrisma from "../daos/prismaDaos/SessionDaoPrisma";
import Session from "../models/Session";
import { hash } from "bcrypt";

export default class TestController {
  private prisma = new PrismaClient();
  private userDao: IUserDao = new UserDaoPrisma();
  private sessionDao: ISessionDao = new SessionDaoPrisma();

  async POST_init_db(req: Request, res: Response, next: NextFunction) {
    // clear db
    await this.prisma.session.deleteMany();
    await this.prisma.user.deleteMany();

    // insert users
    await this.userDao.addUser(
      new User(
        "a-mcdonalid",
        "armando@email.com",
        true,
        false,
        "Armando",
        "Mcdonalid",
        1,
        await hash("armando1234", 10)
      )
    );
    const userCathy = await this.userDao.addUser(
      new User(
        "cathy1990",
        "cathy@email.com",
        true,
        false,
        "Cathy",
        "Gregory",
        2,
        await hash("gregory1234", 10)
      )
    );
    await this.userDao.addUser(
      new User(
        "joanneromero",
        "joanne@email.com",
        true,
        false,
        "Joanne",
        "Romero",
        3,
        await hash("romero1234", 10)
      )
    );
    await this.userDao.addUser(
      new User(
        "kristint",
        "kristin@email.com",
        false,
        false,
        "Kristin",
        "Turner",
        4,
        await hash("turner1234", 10)
      )
    );
    await this.userDao.addUser(
      new User(
        "soham.cunningham",
        "soham@email.com",
        true,
        true,
        "Soham",
        "Cunningham",
        5,
        await hash("cunningham1234", 10)
      )
    );

    // insert sessions
    const dataStoredInToken = {
      id: userCathy.id,
      username: userCathy.username,
      email: userCathy.email,
    };
    const privateKey = fs.readFileSync("./private.key", "utf8");
    const expiresInSeconds = 7 * 24 * 60 * 60; // 1 week
    const refreshToken = AuthUtil.createToken(
      dataStoredInToken,
      expiresInSeconds,
      privateKey
    );
    await this.sessionDao.addSession(
      new Session(1, userCathy.id!, refreshToken)
    );

    // respond
    return res.sendStatus(200);
  }
}
