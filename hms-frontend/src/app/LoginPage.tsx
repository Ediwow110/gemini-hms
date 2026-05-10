import { LoginForm } from "../features/auth/LoginForm";
import { Hospital, ShieldCheck } from "lucide-react";

export const LoginPage = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center lg:justify-end overflow-hidden p-4 lg:p-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear hover:scale-105"
        style={{ backgroundImage: "url('/hospital-bg.png')" }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-slate-900/40 backdrop-blur-[4px]" />

      {/* Decorative gradient overlay to make text pop on the left */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent pointer-events-none hidden lg:block" />

      {/* Hero Content (Left Side) */}
      <div className="hidden lg:flex absolute left-20 top-0 bottom-0 z-10 flex-col justify-center max-w-2xl text-white">
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 w-fit mb-8 animate-fade-in shadow-xl">
          <Hospital className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Next-Generation <br />
          <span className="text-blue-400 bg-clip-text">Healthcare Operations.</span>
        </h1>
        <p className="text-xl text-slate-200 mb-12 leading-relaxed font-medium animate-slide-up stagger-1 max-w-lg">
          Secure, seamless, and integrated platform for modern medical facilities and diagnostic centers.
        </p>
        
        <div className="flex gap-6 animate-slide-up stagger-2">
          <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 shadow-xl">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span className="font-semibold text-sm tracking-wide">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 shadow-xl">
            <Hospital className="h-6 w-6 text-blue-400" />
            <span className="font-semibold text-sm tracking-wide">Enterprise Ready</span>
          </div>
        </div>
      </div>

      {/* Login Card (Right Side) */}
      <div className="relative z-10 w-full max-w-[480px] animate-slide-in-right">
        {/* Glassmorphic Container */}
        <div className="bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 p-8 lg:p-12 relative overflow-hidden">
          
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />

          {/* Mobile Logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="bg-indigo-600 p-3.5 rounded-2xl mb-4 shadow-lg shadow-indigo-600/30">
              <Hospital className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HMS Core</h2>
          </div>

          <div className="hidden lg:block mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Secure Portal
            </h2>
            <p className="text-slate-500 font-medium mt-2">Please enter your credentials to access the system.</p>
          </div>

          <LoginForm />

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
             <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider">
               <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
               Authorized Personnel Only
             </p>
          </div>
        </div>
        
        {/* System Version */}
        <p className="text-center text-xs text-white/50 font-medium mt-8">
          HMS Core v2.0 · Built for Production
        </p>
      </div>
    </div>
  );
};
