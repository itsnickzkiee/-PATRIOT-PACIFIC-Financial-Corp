import jwt, {
  type SignOptions,
} from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: number;
  email: string;
  role: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from the environment variables.",
    );
  }

  return secret;
}

export function createAccessToken(
  payload: AuthTokenPayload,
): string {
  const expiresIn =
    process.env.JWT_EXPIRES_IN || "8h";

  const options: SignOptions = {
    expiresIn:
      expiresIn as SignOptions["expiresIn"],
    issuer: "patriot-pacific-api",
    audience: "patriot-pacific-client",
  };

  return jwt.sign(
    payload,
    getJwtSecret(),
    options,
  );
}

export function verifyAccessToken(
  token: string,
): AuthTokenPayload {
  const decoded = jwt.verify(
    token,
    getJwtSecret(),
    {
      issuer: "patriot-pacific-api",
      audience: "patriot-pacific-client",
    },
  );

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "number" ||
    typeof decoded.email !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error(
      "Invalid authentication token payload.",
    );
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}