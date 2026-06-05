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
  DialogTrigger,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useCreateWorklog } from '../../hooks/useWorklogs';
import { Clock } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';

const workLogSchema = z.object({
  description: z.string().min(5, 'Description must be at least 5 characters'),
  hoursWorked: z.coerce.number().positive('Hours must be positive'),
  attachment: z.any().optional(),
});

type WorkLogFormData = z.infer<typeof workLogSchema>;

interface WorkLogFormDialogProps {
  taskId: string;
}

export const WorkLogFormDialog: React.FC<WorkLogFormDialogProps> = ({ taskId }) => {
  const [open, setOpen] = React.useState(false);
  const { mutate: createWorklog, isPending } = useCreateWorklog();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      description: '',
      hoursWorked: 1,
    },
  });

  const onSubmit = (data: WorkLogFormData) => {
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('hoursWorked', data.hoursWorked.toString());
    
    if (data.attachment && data.attachment.length > 0) {
      formData.append('attachment', data.attachment[0]);
    }

    createWorklog({ taskId, data: formData }, {
      onSuccess: () => {
        reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-2 border-slate-700 bg-slate-800 hover:bg-slate-700">
          <Clock className="w-4 h-4 mr-2" />
          Log Work
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-2 border-slate-700 bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Log Work</DialogTitle>
          <DialogDescription className="text-slate-400">
            Submit your hours and describe what you accomplished.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hoursWorked">Hours Worked</Label>
            <Input
              id="hoursWorked"
              type="number"
              step="0.5"
              {...register('hoursWorked')}
              className="border-slate-700 bg-slate-800"
            />
            {errors.hoursWorked && (
              <p className="text-sm text-red-400">{String(errors.hoursWorked?.message || '')}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="What did you work on?"
              className="border-slate-700 bg-slate-800 h-24 resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-400">{String(errors.description?.message || '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (optional)</Label>
            <Input
              id="attachment"
              type="file"
              {...register('attachment')}
              className="border-slate-700 bg-slate-800 file:text-slate-300"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isPending}
              className="border-2 border-blue-900 bg-blue-600 hover:bg-blue-500 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] transition-all"
            >
              {isPending ? 'Submitting...' : 'Submit Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
