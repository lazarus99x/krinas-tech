"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Signed in successfully!");
    router.push("/post-auth");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/post-auth`,
    });
    if (error) {
      toast.error(error.message);
      setResetLoading(false);
      return;
    }
    setResetSent(true);
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border relative z-10">
        <div className="text-center mb-8">
          <img src="/leverfi.png" alt="CrestrasTrustCore" className="w-12 h-12 mx-auto mb-4" />
          {showReset ? (
            <>
              <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
              <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Sign in to your CrestrasTrustCore account</p>
            </>
          )}
        </div>

        {showReset ? (
          resetSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">
                A password reset link has been sent to <strong>{resetEmail}</strong>
              </p>
              <Button
                onClick={() => { setShowReset(false); setResetSent(false); }}
                variant="outline"
                className="mt-4"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#00FE01] hover:bg-[#B4FE01] text-black" disabled={resetLoading}>
                {resetLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-2"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Sign In
              </button>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10" 
                    placeholder="Enter your email" 
                    required 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-xs text-[#00FE01] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10" 
                    placeholder="Enter your password" 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#00FE01] hover:bg-[#B4FE01] text-black" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-[#00FE01] hover:underline">
                Sign up
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
