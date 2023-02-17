// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import User from "../../models/User";
import InvalidDataDBError from "../errors/InvalidDataDBError";

export default class ValidatorUtil {
  static validateUser(user: User) {
    if (user.username.length < 1 || user.username.length > 100)
      throw new InvalidDataDBError(
        "User username must be 1 to 100 characters of length"
      );
    if (user.email.length < 3 || user.email.length > 255)
      throw new InvalidDataDBError(
        "User email must be 3 to 255 characters of length"
      );
    if (user.firstName.length < 1 || user.firstName.length > 100)
      throw new InvalidDataDBError(
        "User first name must be 1 to 100 characters of length"
      );
    if (user.lastName.length < 1 || user.lastName.length > 100)
      throw new InvalidDataDBError(
        "User last name must be 1 to 100 characters of length"
      );
  }
}
