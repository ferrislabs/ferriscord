import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { LoginForm } from "../ui/login-form";
import { mockApi, mockStorage } from "@/lib/mock-data";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginFeatureProps {
  onLoginSuccess: () => void;
}

export function LoginFeature({ onLoginSuccess }: LoginFeatureProps) {
  const [error, setError] = useState<string>("");

  const loginMutation = useMutation({
    mutationFn: mockApi.login,
    onSuccess: (data) => {
      // Store authentication token
      mockStorage.setAuthToken(data.token);
      mockStorage.setUser(data.user);

      // Clear any previous errors
      setError("");

      // Navigate to dashboard or main app
      onLoginSuccess();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleLogin = (credentials: LoginCredentials) => {
    setError("");
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FerriscordApp</h1>
          <p className="mt-2 text-gray-600">Connect with your community</p>
        </div>

        <LoginForm
          onSubmit={handleLogin}
          isLoading={loginMutation.isPending}
          error={error}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Use <strong>admin@ferriscord.com</strong> / <strong>password</strong> to login
          </p>
        </div>
      </div>
    </div>
  );
}
