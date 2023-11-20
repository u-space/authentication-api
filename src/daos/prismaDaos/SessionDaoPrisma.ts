// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { PrismaClient } from ".prisma/client";
import Session from "../../models/Session";
import ISessionDao from "../ISessionDao";
import { PrismaClientSingleton } from "../PrismaClientSingleton";

export default class SessionDaoPrisma implements ISessionDao {
  prisma = PrismaClientSingleton.getInstance().prisma;

  async addSession(session: Session): Promise<Session> {
    const data: any = {
      userId: session.userId,
      refresh_token: session.refreshToken,
    };
    if (session.id > 0) {
      data["id"] = session.id;
    }
    const dbSession = await this.prisma.session.create({
      data,
    });
    return new Session(dbSession.id, dbSession.userId, dbSession.refresh_token);
  }
  async deleteSession(sessionId: number): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } });
  }
  async getSessionsByUserId(userId: number): Promise<Session[]> {
    const dbSessions = await this.prisma.session.findMany({
      where: {
        userId: userId,
      },
    });
    return dbSessions.map(
      (dbSession) =>
        new Session(dbSession.id, dbSession.userId, dbSession.refresh_token)
    );
  }
}
