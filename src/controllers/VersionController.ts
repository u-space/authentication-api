/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Request, Response } from "express";
import { execSync } from "child_process";

export class VersionController {
  private executeGitCommand(command: any) {
    return execSync(command)
      .toString("utf8")
      .replace(/[\n\r\s]+$/, "");
  }

  async version(request: Request, response: Response) {
    const branch = this.executeGitCommand("git rev-parse --abbrev-ref HEAD");
    const commit = this.executeGitCommand("git log -n 1 HEAD");
    const status = this.executeGitCommand("git status");
    const version = {
      git: {
        HEAD: {
          branch,
          commit,
        },
        status,
      },
    };
    logAndRespond200(response, version, []);
  }
}

const logAndRespond200 = (
  response: any,
  responseBody: any,
  keysToHide: any,
  statusCode = 200
) => {
  logAndRespond(
    response,
    statusCode,
    null,
    responseBody,
    "info",
    null,
    keysToHide
  );
};

const logAndRespond = (
  response: Response,
  statusCode: number,
  message: string | null,
  responseBody: unknown,
  logLevel: string,
  error: any,
  keysToHide: any
) => {
  if (message !== null && responseBody !== null) {
    throw `Message and responseBody can't both be filled [message=${message}, responseBody=${responseBody}]`;
  }
  let responseBodyToLog = {
    ...(responseBody as Record<string, unknown>),
  };
  if (message !== null) {
    responseBodyToLog = { message };
  }
  if (keysToHide !== null) {
    for (let i = 0; i < keysToHide.length; i++) {
      if (typeof responseBodyToLog[keysToHide[i]] !== "undefined") {
        responseBodyToLog[keysToHide[i]] = "__HIDDEN__";
      }
    }
  }
  if (logLevel === "info") {
  } else if (logLevel === "warn") {
  } else if (logLevel === "error") {
    console.log(error);
  }

  if (message !== null) {
    response.status(statusCode).json({ message });
  } else if (responseBody !== null) {
    response.status(statusCode).json(responseBody);
  } else {
    response.status(statusCode).send();
  }
};
