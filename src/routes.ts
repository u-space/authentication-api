// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Router } from "express";
import AuthController from "./controllers/AuthController";
import IndexController from "./controllers/IndexController";
import TestController from "./controllers/TestController";
import UserController from "./controllers/UserController";

const router = Router();

/* -------------------------------------------------------
 * ------------------------ auth  ------------------------
 * -------------------------------------------------------
 */
const authController = new AuthController();

router.post("/auth/login", authController.POST_login.bind(authController));
router.post(
  "/auth/login_session",
  authController.POST_login_session.bind(authController)
);
router.post("/auth/signup", authController.POST_signup.bind(authController));
router.post(
  "/auth/signup_magic",
  authController.POST_signup_magic.bind(authController)
);
router.post("/auth/password", authController.PUT_password.bind(authController));
router.post("/auth/update", authController.PUT_update.bind(authController));
router.put("/auth/password", authController.PUT_password.bind(authController));
router.put("/auth/update", authController.PUT_update.bind(authController));

/* -------------------------------------------------------
 * ------------------------ index ------------------------
 * -------------------------------------------------------
 */
const indexController = new IndexController();

router.get("/index", indexController.index.bind(indexController));

/* -------------------------------------------------------
 * ------------------------ user  ------------------------
 * -------------------------------------------------------
 */
const userController = new UserController();

router.get(
  "/users/:username",
  userController.GET_user_by_username.bind(userController)
);
router.post(
  "/users/users_by_username",
  userController.POST_users_by_usernames.bind(userController)
);

/* -------------------------------------------------------
 * ------------------------ test  ------------------------
 * -------------------------------------------------------
 */
if (process.env.NODE_ENV === "test") {
  const testController = new TestController();
  router.post(
    "/test/init_db",
    testController.POST_init_db.bind(testController)
  );
}

export { router };
