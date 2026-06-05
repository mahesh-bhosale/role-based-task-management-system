import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { User } from '../../types/api.types';
import { Switch } from '../../components/ui/switch';
import { Loader2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: User | null;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({ open, onOpenChange, userToEdit }) => {
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const isEditing = !!userToEdit;
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  const roleValue = watch('role');
  const isActiveValue = watch('isActive');

  React.useEffect(() => {
    if (open) {
      if (userToEdit) {
        reset({
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
          isActive: userToEdit.isActive,
          password: '',
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'EMPLOYEE',
          isActive: true,
        });
      }
    }
  }, [open, userToEdit, reset]);

  const onSubmit = (data: UserFormData) => {
    const payload: Partial<User> & { password?: string } = {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
    };

    if (data.password) {
      payload.password = data.password;
    }

    if (isEditing) {
      updateUser({ id: userToEdit.id, data: payload }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createUser(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-2 border-slate-700 bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing ? 'Update the details for this employee.' : 'Create a new employee profile to grant them access.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register('name')}
              className="border-slate-700 bg-slate-800"
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="border-slate-700 bg-slate-800"
            />
            {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {isEditing && <span className="text-slate-500 font-normal">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className="border-slate-700 bg-slate-800"
            />
            {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={roleValue} onValueChange={(value: any) => setValue('role', value)}>
              <SelectTrigger className="border-slate-700 bg-slate-800">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-400">{errors.role.message}</p>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="isActive" className="text-slate-300">Active Account</Label>
            <Switch 
              id="isActive" 
              checked={isActiveValue} 
              onCheckedChange={(checked: boolean) => setValue('isActive', checked)} 
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isPending}
              className="border-2 border-blue-900 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] transition-all flex items-center"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
