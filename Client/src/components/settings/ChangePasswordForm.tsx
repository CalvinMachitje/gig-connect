// src/components/settings/ChangePasswordForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";   
import { changePasswordSchema, type ChangePasswordForm } from "@/schemas/changePasswordSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = form;

  const onSubmit = async (data: ChangePasswordForm) => {
    setLoading(true);

    try {
      // Step 1: Re-authenticate with current password (recommended security step)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || "",
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully!");
      reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription className="text-slate-400">
          Update your account password. You'll need to enter your current password for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-slate-200">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
              className="bg-slate-800 border-slate-600 text-white"
            />
            {errors.currentPassword && (
              <p className="text-red-400 text-sm">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-slate-200">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
              className="bg-slate-800 border-slate-600 text-white"
            />
            {errors.newPassword && (
              <p className="text-red-400 text-sm">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword" className="text-slate-200">
              Confirm New Password
            </Label>
            <Input
              id="confirmNewPassword"
              type="password"
              {...register("confirmNewPassword")}
              className="bg-slate-800 border-slate-600 text-white"
            />
            {errors.confirmNewPassword && (
              <p className="text-red-400 text-sm">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}