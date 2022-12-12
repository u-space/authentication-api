// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import Session from "src/models/Session";
import ISessionDao from "../ISessionDao";
import InMemoryDB from "./InMemoryDB";

export default class SessionDaoInMemory implements ISessionDao {
  async addSession(session: Session): Promise<Session> {
    return Promise.resolve(InMemoryDB.addSession(session));
  }

  async deleteSession(sessionId: number): Promise<void> {
    InMemoryDB.deleteSession(sessionId);
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    return Promise.resolve(
      InMemoryDB.getSessions().filter((session) => session.userId === userId)
    );
  }
}
