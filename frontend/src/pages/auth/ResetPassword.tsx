import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { CheckSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../hooks/use-toast';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({ title: 'Invalid Link', description: 'Reset token is missing from the URL.', variant: 'destructive' });
      return;
    }

    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
      toast({ title: 'Password successfully reset.' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast({ 
        title: 'Reset Failed', 
        description: error.response?.data?.message || 'The token may have expired. Please try requesting a new link.',
        variant: 'destructive'
      });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-md card-3d bg-slate-900 border-slate-700 text-center py-8">
          <CardTitle className="text-xl text-red-400 mb-2">Invalid Reset Link</CardTitle>
          <CardDescription className="mb-6">The password reset link is invalid or missing the required token.</CardDescription>
          <Link to="/forgot-password">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Request New Link
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl shadow-[4px_4px_0px_0px_#facc15]">
          <CheckSquare className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">TaskFlow</h1>
      </div>

      <Card className="w-full max-w-md card-3d bg-slate-900 border-slate-700">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-slate-400">
            {isSuccess ? 'Password successfully changed' : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="bg-green-500/20 text-green-400 p-4 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-slate-300 mb-6">
                Your password has been successfully reset. You will be redirected to the login page momentarily.
              </p>
              <Link to="/login" className="w-full">
                <Button className="w-full bg-slate-800 text-white hover:bg-slate-700">
                  Go to Login Now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="bg-slate-950 border-slate-700 text-white focus-visible:ring-primary"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className="bg-slate-950 border-slate-700 text-white focus-visible:ring-primary"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                isLoading={isSubmitting}
              >
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
        {!isSuccess && (
          <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
            <Link to="/login" className="flex items-center text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
