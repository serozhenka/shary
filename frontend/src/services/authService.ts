interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

const API_BASE_URL = "http://localhost:8000";

class AuthService {
  private token: string | null = null;

  constructor() {
    // Only load token from localStorage on initialization
    this.token = localStorage.getItem("auth_token");
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Помилка входу");
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.token);
    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Помилка реєстрації");
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }
}

export const authService = new AuthService();
export type { AuthResponse, LoginRequest, RegisterRequest, User };
