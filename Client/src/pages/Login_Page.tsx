// src/pages/LoginPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Facebook, Chrome, Users } from "lucide-react";
import { Link } from "react-router-dom"; // Add this for navigation

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-1 text-center relative">
          <Link to="/" className="absolute left-4 top-4 text-slate-400 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-600/20 rounded-full">
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">D's Virtual Space</CardTitle>
          <CardDescription className="text-slate-400">Access your personal team</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                className="pl-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-11 pr-11 bg-slate-800/60 border-slate-700 text-white focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/ForgotPassword" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 text-lg">
            Log In
          </Button>

          <div className="relative my-6">
            <Separator className="bg-slate-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-slate-900 px-4 text-xs text-slate-500 uppercase tracking-wider">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <Facebook className="mr-2 h-5 w-5" /> Facebook
            </Button>
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <Chrome className="mr-2 h-5 w-5" /> Google
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col text-center text-sm text-slate-400 pt-6 border-t border-slate-800">
          <p>Don't have an account?</p>
          <Link to="/Signup_Page" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
            Apply for access →
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}