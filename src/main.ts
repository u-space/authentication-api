// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

import App from "./app";
import { cleanEnv, port, str } from "envalid";
import DaoFactory, { DaoImplementation } from "./daos/DaoFactory";
import User from "./models/User";
import { hash } from "bcrypt";

const initDB = async () => {
  const daoFactory = new DaoFactory(DaoImplementation.IN_MEMORY);
  daoFactory
    .getUserDao()
    .addUser(
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
  daoFactory
    .getUserDao()
    .addUser(
      new User(
        "tomcruise",
        "tomcruise@email.com",
        true,
        true,
        "Tom",
        "Cruise",
        undefined,
        await hash("tom1234", 10)
      )
    );
};

try {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
  });
  const app = new App();
  app.listen();

  initDB();
} catch (error) {
  console.log(error);
}
