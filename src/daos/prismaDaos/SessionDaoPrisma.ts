// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import Session from "src/models/Session";
import ISessionDao from "../ISessionDao";

export default class SessionDaoPrisma implements ISessionDao {
  async addSession(session: Session): Promise<Session> {
    throw new Error("Method not implemented.");
  }
  async deleteSession(sessionId: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getSessionsByUserId(userId: string): Promise<Session[]> {
    throw new Error("Method not implemented.");
  }
}
