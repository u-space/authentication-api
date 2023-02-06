// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export default class Session {
  id: number;
  userId: number;
  refreshToken: string;

  constructor(id: number, userId: number, refreshToken: string) {
    this.id = id;
    this.userId = userId;
    this.refreshToken = refreshToken;
  }

  clone(): Session {
    return new Session(this.id, this.userId, this.refreshToken);
  }
}
