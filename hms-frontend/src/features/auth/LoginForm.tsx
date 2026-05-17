import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "./login-schema";
import { Eye, EyeOff, LogIn, Loader2, Building2 } from "lucide-react";
import { apiClient } from "../../lib/api";

interface Branch {
  id: string;
  name: string;
  code: string;
}

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[] | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: "Central Hospital (Main Branch)",
      email: "admin@hospital.com",
      password: "Admin@123",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/v1/auth/login", data);
      const { access_token, user } = response.data;
      
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.branchId) {
        window.location.assign("/");
      } else {
        // Fetch branches for selection
        const branchesRes = await apiClient.get("/v1/auth/branches");
        setAvailableBranches(branchesRes.data);
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBranch = async (branchId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/v1/auth/select-branch", { branchId });
      const { access_token, user } = response.data;
      
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.assign("/");
    } catch {
      setError("Failed to select branch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (availableBranches) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Select Branch</h3>
          <p className="text-sm text-slate-500 mt-1">Your account is assigned to multiple branches.</p>
        </div>
        <div className="grid gap-3">
          {availableBranches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSelectBranch(branch.id)}
              disabled={isLoading}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
            >
              <div className="bg-slate-100 group-hover:bg-indigo-100 p-2.5 rounded-xl transition-colors">
                <Building2 className="h-5 w-5 text-slate-500 group-hover:text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{branch.name}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{branch.code}</p>
              </div>
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setAvailableBranches(null); localStorage.clear(); }}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 w-full text-center"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-5 w-full">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium animate-shake">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {/* Tenant Code Field */}
        <div className="space-y-1.5 animate-fade-in">
          <label className="block text-sm font-semibold text-slate-700">
            Organization / Tenant Code
          </label>
          <input
            {...register("tenantCode")}
            type="text"
            placeholder="e.g. Central Hospital"
            className="input"
            autoComplete="organization"
          />
          {errors.tenantCode && (
            <p className="text-rose-500 text-xs mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.tenantCode.message}
            </p>
          )}
        </div>

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
            <p className="text-rose-500 text-xs mt-1 flex items-center gap-1">
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
            <p className="text-rose-500 text-xs mt-1 flex items-center gap-1">
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
            Processing...
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
