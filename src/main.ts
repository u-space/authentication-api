// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

import App from "./app";
import { cleanEnv, port, str } from "envalid";

try {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
  });
  const app = new App();
  app.listen();
} catch (error) {
  console.log(error);
}
