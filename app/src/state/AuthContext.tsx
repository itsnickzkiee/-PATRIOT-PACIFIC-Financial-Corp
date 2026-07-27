import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
};

type LoginResult = {
  success: boolean;
  message: string;
  mustChangePassword?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<LoginResult>;

  logout: () => void;
};

type StoredAuth = {
  user: User;
  token: string;
};

type LoginResponse = {
  message?: string;
  token?: string;
  user?: User;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const LOCAL_AUTH_KEY = "patriotAuth";
const SESSION_AUTH_KEY = "patriotSessionAuth";

const API_URL = "http://localhost:5000/api";

function readStoredAuth(): StoredAuth | null {
  try {
    const savedAuth =
      localStorage.getItem(LOCAL_AUTH_KEY) ??
      sessionStorage.getItem(SESSION_AUTH_KEY);

    if (!savedAuth) {
      return null;
    }

    const parsedAuth = JSON.parse(
      savedAuth,
    ) as Partial<StoredAuth>;

    if (
      !parsedAuth.user ||
      typeof parsedAuth.token !== "string" ||
      !parsedAuth.token.trim()
    ) {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      sessionStorage.removeItem(
        SESSION_AUTH_KEY,
      );

      return null;
    }

    return {
      user: parsedAuth.user,
      token: parsedAuth.token,
    };
  } catch {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    sessionStorage.removeItem(
      SESSION_AUTH_KEY,
    );

    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [storedAuth, setStoredAuth] =
    useState<StoredAuth | null>(
      readStoredAuth,
    );

  const user = storedAuth?.user ?? null;
  const token = storedAuth?.token ?? null;

  async function login(
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<LoginResult> {
    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail || !password) {
      return {
        success: false,
        message:
          "Please enter your email and password.",
      };
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        },
      );

      const data =
        (await response.json()) as LoginResponse;

      if (
        !response.ok ||
        !data.user ||
        !data.token
      ) {
        return {
          success: false,
          message:
            data.message ??
            "Incorrect email or password.",
        };
      }

      const nextAuth: StoredAuth = {
        user: data.user,
        token: data.token,
      };

      localStorage.removeItem(
        LOCAL_AUTH_KEY,
      );

      sessionStorage.removeItem(
        SESSION_AUTH_KEY,
      );

      if (rememberMe) {
        localStorage.setItem(
          LOCAL_AUTH_KEY,
          JSON.stringify(nextAuth),
        );
      } else {
        sessionStorage.setItem(
          SESSION_AUTH_KEY,
          JSON.stringify(nextAuth),
        );
      }

      setStoredAuth(nextAuth);

      return {
        success: true,
        message:
          data.message ??
          "Login successful.",
        mustChangePassword:
          data.user.mustChangePassword,
      };
    } catch (error) {
      console.error(
        "Unable to connect to backend:",
        error,
      );

      return {
        success: false,
        message:
          "Cannot connect to the backend server. Make sure it is running.",
      };
    }
  }

  function logout(): void {
    localStorage.removeItem(
      LOCAL_AUTH_KEY,
    );

    sessionStorage.removeItem(
      SESSION_AUTH_KEY,
    );

    setStoredAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(
          user && token,
        ),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}