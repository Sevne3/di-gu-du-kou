const { SignJWT, jwtVerify } = require("jose");
const secret = new TextEncoder().encode("di-gu-du-kou-secret-key-2026");

async function createToken(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

module.exports = { createToken, verifyToken };