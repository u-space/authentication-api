// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NextFunction, Request, Response } from "express";
import AuthService from "../services/AuthService";
import Joi from "joi";
import { HttpError } from "../errors/HttpError";
import fs from "fs";
import DaoFactory, { DaoImplementation } from "../../src/daos/DaoFactory";
import NoDataError from "../../src/services/errors/NoDataError";
import InvalidDataError from "../../src/services/errors/InvalidDataError";
import { error } from "winston";
import User from "../../src/models/User";

const passwordType = Joi.string().min(8).max(64).required();

function isUserDataValid(data, optionalPassword = false) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: !optionalPassword ? passwordType : Joi.string().optional(),
    email: Joi.string().email().required(),
    verified: Joi.boolean(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    extraData: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  });

  if (schema.validate(data).error) {
    throw new Error(schema.validate(data).error.message);
  }
}

function isUserLoginDataValid(data) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    extraData: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  });

  if (schema.validate(data).error) {
    throw new Error(schema.validate(data).error.message);
  }
}

class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    const daoFactory = new DaoFactory(DaoImplementation.IN_MEMORY);
    this.authService = authService
      ? authService
      : new AuthService(daoFactory.getUserDao(), daoFactory.getSessionDao());
  }

  public POST_signup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData = req.body;
      isUserDataValid(userData);
      const signUpUserData = await this.authService.signup(userData);
      res.status(201).json({ data: signUpUserData, message: "signup" });
    } catch (error) {
      const error2 = new HttpError(400, "hola");
      console.log("error2");
      console.log(error2);
      next(error2);
      //next(error);
    }
  };

  public POST_signup_magic = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData = req.body;
      isUserDataValid(userData, true);
      console.log("POST_signup_magic", JSON.stringify(userData));

      res.status(201).json({
        data: await this.authService.signupMagic(userData),
        message: "signup_magic",
      });
    } catch (error) {
      next(error);
    }
  };

  public POST_login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userData = req.body;
    try {
      isUserLoginDataValid(userData);
    } catch (error) {
      respondHTTPError(
        res,
        400,
        `invalid request body (expected ${JSON.stringify({
          username: "",
          password: "",
        })})`
      );
      return;
    }

    try {
      const data = await this.authService.login(userData);
      res.status(200).json({
        data,
        message: "login",
      });
    } catch (error) {
      if (error instanceof NoDataError) {
        respondHTTPError(res, 404, "invalid username or password");
      } else if (error instanceof InvalidDataError) {
        respondHTTPError(res, 400, (error as InvalidDataError).message);
      } else {
        next(new HttpError(500, (error as Error).message));
      }
    }
  };

  public POST_login_session = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const publicKey = fs.readFileSync("./public.key", "utf8");
      const session = req.body;
      res.status(200).json({
        data: await this.authService.loginByRefreshToken(publicKey, session),
        message: "login_session",
      });
    } catch (error) {
      next(error);
    }
  };

  public PUT_password = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req.body;
      const schema = Joi.object({
        username: Joi.string().required(),
        password: passwordType,
      });
      if (schema.validate(data).error) {
        respondHTTPError(res, 400, `${schema.validate(data).error.message}`);
        return;
      }
      let userUpdated: User;
      try {
        userUpdated = await this.authService.updatePassword(
          data.username,
          data.password
        );
      } catch (error) {
        if (error instanceof NoDataError) {
          respondHTTPError(res, 404, "No user with the received username");
        } else if (error instanceof InvalidDataError) {
          respondHTTPError(res, 400, (error as InvalidDataError).message);
        } else {
          respondHTTPError(res, 500);
        }
        return;
      }
      res.status(200).json({
        data: userUpdated,
        message: "password",
      });
    } catch (error) {
      next(error);
    }
  };

  public PUT_update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req.body;
      const schema = Joi.object({
        username: Joi.required(),
        verified: Joi.boolean(),
        disabled: Joi.boolean(),
      });

      if (schema.validate(data).error) {
        throw new Error(schema.validate(data).error.message);
      }

      res.status(200).json({
        data: await this.authService.updateUser(data),
        message: "update",
      });
    } catch (error) {
      next(error);
    }
  };
}

const respondHTTPError = (
  res: Response,
  statusCode: number,
  errorMessage?: string
) => {
  if (errorMessage) {
    res.status(statusCode).json({ message: error });
  } else {
    res.status(statusCode);
  }
};

export default AuthController;
