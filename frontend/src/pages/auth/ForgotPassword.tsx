import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
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
import { CheckSquare, ArrowLeft, Mail } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
      toast({ title: 'Password reset link sent to your email.' });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  };

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
          <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
          <CardDescription className="text-slate-400">
            {isSuccess ? 'Check your email for the reset link' : 'Enter your email to receive a password reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="bg-green-500/20 text-green-400 p-4 rounded-full mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <p className="text-slate-300 mb-6">
                We've sent a password reset link to your email address. Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="w-full">
                <Button className="w-full bg-slate-800 text-white hover:bg-slate-700">
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className="bg-slate-950 border-slate-700 text-white focus-visible:ring-primary"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                isLoading={isSubmitting}
              >
                Send Reset Link
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
