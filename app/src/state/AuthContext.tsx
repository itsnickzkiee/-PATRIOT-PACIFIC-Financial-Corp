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
};

type AuthContextType = {
  user: User | null;
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
};

type LoginResponse = {
  message?: string;
  user?: User;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const LOCAL_AUTH_KEY = "patriotAuth";
const SESSION_AUTH_KEY = "patriotSessionAuth";

const API_URL = "http://localhost:5000/api";

function readCurrentUser(): User | null {
  try {
    const savedAuth =
      localStorage.getItem(LOCAL_AUTH_KEY) ??
      sessionStorage.getItem(SESSION_AUTH_KEY);

    if (!savedAuth) {
      return null;
    }

    const parsedAuth = JSON.parse(
      savedAuth,
    ) as StoredAuth;

    return parsedAuth.user;
  } catch {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    sessionStorage.removeItem(SESSION_AUTH_KEY);

    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    readCurrentUser,
  );

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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        },
      );

      const data =
        (await response.json()) as LoginResponse;

      if (!response.ok || !data.user) {
        return {
          success: false,
          message:
            data.message ??
            "Incorrect email or password.",
        };
      }

      const storedAuth: StoredAuth = {
        user: data.user,
      };

      localStorage.removeItem(LOCAL_AUTH_KEY);
      sessionStorage.removeItem(
        SESSION_AUTH_KEY,
      );

      if (rememberMe) {
        localStorage.setItem(
          LOCAL_AUTH_KEY,
          JSON.stringify(storedAuth),
        );
      } else {
        sessionStorage.setItem(
          SESSION_AUTH_KEY,
          JSON.stringify(storedAuth),
        );
      }

      setUser(data.user);

      return {
        success: true,
        message:
          data.message ?? "Login successful.",
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
    localStorage.removeItem(LOCAL_AUTH_KEY);

    sessionStorage.removeItem(
      SESSION_AUTH_KEY,
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
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