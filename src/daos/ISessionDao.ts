// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import Session from "../models/Session";

export default interface ISessionDao {
  addSession(session: Session): Promise<Session>;
  deleteSession(sessionId: number): Promise<void>;
  getSessionsByUserId(userId: number): Promise<Session[]>;
}
