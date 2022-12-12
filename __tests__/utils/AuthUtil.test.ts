// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import fs from "fs";
import AuthUtil from "../../src/utils/AuthUtil";

describe("utils/AuthUtil", () => {
  const privateKey = fs.readFileSync(`${__dirname}/private-test.key`, "utf8");
  const publicKey = fs.readFileSync(`${__dirname}/public-test.key`, "utf8");
  const otherPublicKey = fs.readFileSync(
    `${__dirname}/other-public-test.key`,
    "utf8"
  );
  const tokenGeneratedUsingStringPayload =
    "eyJhbGciOiJSUzI1NiJ9.c29tZV9zdHJpbmc.Jq3aoK3Nv5bijP6sBbl-gNv7IUY-jJIIBVBnRTAoBg_tym3R4TugHCiTmyXB0rDwNBDXiwAOOQy1cOnbcXAm7rp9MTTkVHl5fL8sBayJc3vmJfEb6m_mqJxGQ5fORcEPS9IXkjrZVPJ9ZtD90a-H04npYmCxd5VOIzCIljc1h8I";

  test("complete tests", () => {
    const dataStoredInToken = { username: "johndoe" };
    const expiresInSeconds = 300;
    // test create token with invalid private key
    expect(() => {
      AuthUtil.createToken(
        dataStoredInToken,
        expiresInSeconds,
        "invalid-private-key"
      );
    }).toThrow();

    // create valid token
    const token = AuthUtil.createToken(
      dataStoredInToken,
      expiresInSeconds,
      privateKey
    );

    // verify an invalid token
    expect(() => {
      AuthUtil.verifyToken("invalid-token", publicKey);
    }).toThrow();

    // verify token generated using string payload
    expect(() => {
      AuthUtil.verifyToken(tokenGeneratedUsingStringPayload, publicKey);
    }).toThrow();

    // verify with invalid public key
    expect(() => {
      AuthUtil.verifyToken(token, "invalid-public-key");
    }).toThrow();

    // verify with public key not matching with private key used
    expect(() => {
      AuthUtil.verifyToken(token, otherPublicKey);
    }).toThrow();

    // verify the token, and check data received is correct
    const dataStoredInTokenReceivedAfterVerify = AuthUtil.verifyToken(
      token,
      publicKey
    );
    expect(dataStoredInTokenReceivedAfterVerify.username).toBe(
      dataStoredInToken.username
    );

    // decode invalid token
    expect(() => {
      AuthUtil.decodeToken("some-invalid-token");
    }).toThrow();

    // decode token generated using string payload
    expect(() => {
      AuthUtil.decodeToken(tokenGeneratedUsingStringPayload);
    }).toThrow();

    // decode valid token
    const decodedToken = AuthUtil.decodeToken(token);
    expect(decodedToken.username).toBe(dataStoredInToken.username);
  });
});

// -----------------------------------------------------------
// ---------------------- aux functions ----------------------
// -----------------------------------------------------------
