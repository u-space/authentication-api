// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import InMemoryDB from "./inMemoryDaos/InMemoryDB";
import SessionDaoInMemory from "./inMemoryDaos/SessionDaoInMemory";
import UserDaoInMemory from "./inMemoryDaos/UserDaoInMemory";
import ISessionDao from "./ISessionDao";
import IUserDao from "./IUserDao";
import SessionDaoPrisma from "./prismaDaos/SessionDaoPrisma";
import UserDaoPrisma from "./prismaDaos/UserDaoPrisma";

export default class DaoFactory {
  private daoImplementation: DaoImplementation;

  constructor(daoImplementation: DaoImplementation) {
    this.daoImplementation = daoImplementation;
  }

  clearDatabase(): Promise<void> {
    if (this.daoImplementation === DaoImplementation.PRISMA) {
      throw new Error("Not implemented.");
    } else if (this.daoImplementation === DaoImplementation.IN_MEMORY) {
      InMemoryDB.clearDB();
      return;
    }
    throw new Error(`invalid daoImplementation (${this.daoImplementation})`);
  }

  getUserDao(): IUserDao {
    if (this.daoImplementation === DaoImplementation.PRISMA) {
      return new UserDaoPrisma();
    } else if (this.daoImplementation === DaoImplementation.IN_MEMORY) {
      return new UserDaoInMemory();
    }
    throw new Error(`invalid daoImplementation (${this.daoImplementation})`);
  }

  getSessionDao(): ISessionDao {
    if (this.daoImplementation === DaoImplementation.PRISMA) {
      return new SessionDaoPrisma();
    } else if (this.daoImplementation === DaoImplementation.IN_MEMORY) {
      return new SessionDaoInMemory();
    }
    throw new Error(`invalid daoImplementation (${this.daoImplementation})`);
  }
}

export enum DaoImplementation {
  PRISMA,
  IN_MEMORY,
}
