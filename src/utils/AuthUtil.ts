// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { decode, sign, verify } from "jsonwebtoken";
import { DataStoredInToken } from "../interfaces";

export default class AuthUtil {
  static createToken(
    dataStoredInToken: object,
    expiresInSeconds: number,
    privateKey: string
  ): string {
    return sign(dataStoredInToken, privateKey, {
      expiresIn: expiresInSeconds,
      algorithm: "RS256",
    });
  }

  static verifyToken(token: string, publicKey: string) {
    const data = verify(token, publicKey, {
      algorithms: ["RS256"],
    });
    if (typeof data !== "string") {
      return {
        ...data,
        expirationDate: new Date("exp" in data ? data.exp * 1000 : 0),
      } as DataStoredInToken;
    } else {
      throw Error("Invalid JWT");
    }
  }

  static decodeToken(token: string) {
    const data = decode(token);
    if (typeof data !== "string") {
      return {
        ...data,
        expirationDate: new Date("exp" in data ? data.exp * 1000 : 0),
      } as DataStoredInToken;
    } else {
      throw Error("Invalid JWT");
    }
  }
}
