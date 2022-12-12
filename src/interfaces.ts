// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Request } from "express";
import { User } from "@prisma/client";

export interface DataStoredInToken {
  id: number;
  username: string;
  email: string;
  role: string;
  expirationDate: Date;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
}

export interface RequestWithUserAndPayload extends RequestWithUser {
  payload: DataStoredInToken;
}
