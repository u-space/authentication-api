// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/AuthService';
import Joi from 'joi';
import { HttpError } from '../errors/HttpError';
import fs from 'fs';
import DaoFactory, { DaoImplementation } from '../daos/DaoFactory';
import NoDataError from '../services/errors/NoDataError';
import InvalidDataError from '../services/errors/InvalidDataError';
import User from '../models/User';
import AlreadyDataError from '../services/errors/AlreadyDataError';

const passwordType = Joi.string().min(8).max(64).required();

function isUserDataValid(data: any, optionalPassword = false) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(255).required(),
    password: !optionalPassword ? passwordType : Joi.string().optional(),
    email: Joi.string().email().required(),
    verified: Joi.boolean(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    extraData: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  });

  if (schema.validate(data).error) {
    const error = schema.validate(data).error;
    if (error !== undefined) throw new Error(error.message);
    throw new Error('Invalid user');
  }
}

function isUserLoginDataValid(data: any) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    extraData: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  });

  if (schema.validate(data).error) {
    const error = schema.validate(data).error;
    if (error !== undefined) throw new Error(error.message);
    throw new Error('Invalid user login data');
  }
}

class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    const daoFactory = new DaoFactory(DaoImplementation.PRISMA);
    this.authService = authService
      ? authService
      : new AuthService(daoFactory.getUserDao(), daoFactory.getSessionDao());
  }

  public POST_signup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userData = req.body;
    try {
      isUserDataValid(userData);
    } catch (error) {
      respondHTTPError(res, 400, (error as Error).message);
      return;
    }
    try {
      const signUpUserData = await this.authService.signupMagic(
        userData,
        false
      );
      res.status(201).json({ data: signUpUserData, message: 'signup' });
    } catch (error) {
      if (error instanceof AlreadyDataError) {
        return respondHTTPError(res, 400, (error as Error).message);
      }
      next(error);
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

      res.status(201).json({
        data: await this.authService.signupMagic(userData, true),
        message: 'signup_magic',
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
          username: '',
          password: '',
        })})`
      );
      return;
    }

    try {
      const data = await this.authService.login(userData);
      res.status(200).json({
        data,
        message: 'login',
      });
    } catch (error) {
      if (error instanceof NoDataError) {
        respondHTTPError(res, 404, 'invalid username or password');
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
      const publicKey = fs.readFileSync('./public.key', 'utf8');

      // validate received request body
      const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        refresh_token: Joi.string().required(),
        extraData: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
      });
      const validationResult = schema.validate(req.body);
      if (validationResult.error) {
        return respondHTTPError(res, 400, validationResult.error.message);
      }

      const session = req.body;
      res.status(200).json({
        data: await this.authService.loginByRefreshToken(publicKey, session),
        message: 'login_session',
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
        const error = schema.validate(data).error;
        return respondHTTPError(
          res,
          400,
          error ? error.message : 'Invalid data'
        );
      }
      let userUpdated: User;
      try {
        userUpdated = await this.authService.updatePassword(
          data.username,
          data.password
        );
      } catch (error) {
        if (error instanceof NoDataError) {
          respondHTTPError(res, 404, 'No user with the received username');
        } else if (error instanceof InvalidDataError) {
          respondHTTPError(res, 400, (error as InvalidDataError).message);
        } else {
          respondHTTPError(res, 500);
        }
        return;
      }
      res.status(200).json({
        data: userUpdated,
        message: 'password',
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
        const error = schema.validate(data).error;
        throw new Error(error ? error.message : 'Invalid data');
      }

      res.status(200).json({
        data: await this.authService.updateUser(data),
        message: 'update',
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
    res.status(statusCode).json({ message: errorMessage });
  } else {
    res.status(statusCode);
  }
};

export default AuthController;
