import jwt from "jsonwebtoken";

const SECRET = process.env.ADMIN_JWT_SECRET!;

export function signJwt(payload: any) {
  return jwt.sign(payload, SECRET, { expiresIn: "1d" });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
