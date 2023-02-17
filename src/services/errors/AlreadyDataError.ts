// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export default class AlreadyDataError extends Error {
  previousError?: Error;
  constructor(msg: string, error?: Error) {
    super(msg);
    this.previousError = error;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AlreadyDataError.prototype);
  }
}
