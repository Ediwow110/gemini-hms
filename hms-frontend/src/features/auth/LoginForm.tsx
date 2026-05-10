import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "./login-schema";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = () => {
    setIsLoading(true);
    // TEMPORARY TEST BYPASS
    setTimeout(() => {
      localStorage.setItem("token", "mock-token-123");
      window.location.assign("/");
    }, 800);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5 w-full">
      <div className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5 animate-fade-in stagger-1">
          <label className="block text-sm font-semibold text-slate-700">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@hospital.com"
            className="input"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 animate-fade-in">
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 animate-fade-in stagger-2">
          <label className="block text-sm font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="input pr-11"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 animate-fade-in">
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      {/* Remember & Forgot */}
      <div className="flex items-center justify-between animate-fade-in stagger-3">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
            Remember device
          </span>
        </label>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="btn btn-primary w-full justify-center py-3 text-sm gap-2 animate-fade-in stagger-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in to Dashboard
          </>
        )}
      </button>
    </form>
  );
};
