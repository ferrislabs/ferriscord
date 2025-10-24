// Auth domain exports
export { LoginFeature } from "./features/login";
export { LoginForm } from "./ui/login-form";

// Types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}
