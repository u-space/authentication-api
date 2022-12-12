// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from "./config";
import { logger, stream } from "./logger";
import https from "https";
import fs from "fs";
import { HttpError } from "./errors/HttpError";
import { router } from "./routes";

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public credentials: { key: string; cert: string };

  constructor() {
    this.app = express();
    this.env = NODE_ENV || "development";
    this.port = PORT || 1737;

    const privateKey = fs.readFileSync(
      process.env.SSL_KEY || "./certificates/key.pem",
      "utf8"
    );
    const certificate = fs.readFileSync(
      process.env.SSL_CERT || "./certificates/cert.pem",
      "utf8"
    );

    this.credentials = { key: privateKey, cert: certificate };

    this.initializeMiddlewares();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  public listen() {
    try {
      console.log("Starting server...");
      const httpsServer = https.createServer(this.credentials, this.app);
      httpsServer.listen(this.port, () => {
        logger.info("=================================");
        logger.info(`======= ENV: ${this.env} =======`);
        logger.info(`(microutm-auth) listening on the https port ${this.port}`);
        logger.info("=================================");
      });
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(router);
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: "REST API",
          version: "1.0.0",
          description: "Example docs",
        },
      },
      apis: ["swagger.yaml"],
    };

    const specs = swaggerJSDoc(options);
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    const errorMiddleware = (
      error: HttpError,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      //console.log("Error");
      //console.log(`error: ${error.status}`);
      //console.log(error);
      try {
        const status: number = error.status || 500;
        const message: string = error.message || "Something went wrong";

        logger.error(
          `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`
        );
        res.status(status).json({ message });
      } catch (error) {
        next(error);
      }
    };
    this.app.use(errorMiddleware);
  }
}

export default App;
