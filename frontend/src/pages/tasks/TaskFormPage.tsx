import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTask, useCreateTask, useUpdateTask, useAssignTask, useUnassignTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar as CalendarIcon, ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import { TASK_PRIORITY_LABELS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  priority: z.string().min(1, 'Priority is required'),
  deadline: z.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  assigneeId: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export const TaskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: task, isLoading: isLoadingTask } = useTask(id || '');
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ limit: 100 });
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ role: 'EMPLOYEE', limit: 100 });
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const assignTask = useAssignTask();
  const unassignTask = useUnassignTask();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM',
    }
  });

  useEffect(() => {
    if (isEdit && task) {
      // API might return assigneeId or assignments list
      const currentAssigneeId = task.assignments?.[0]?.userId || task.assignee?.id || task.assigneeId || '';
      reset({
        name: task.name,
        description: task.description || '',
        projectId: task.projectId,
        priority: task.priority,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        estimatedHours: task.estimatedHours || undefined,
        assigneeId: currentAssigneeId,
      });
    }
  }, [isEdit, task, reset]);

  const onSubmit = async (data: TaskFormValues) => {
    const payload = {
      ...data,
      deadline: data.deadline?.toISOString(),
      assignedToUserId: data.assigneeId || undefined, // Backend schema expects this for create
    };
    
    // Remove assigneeId from payload
    delete payload.assigneeId;

    if (Number.isNaN(payload.estimatedHours)) {
      delete payload.estimatedHours;
    }

    try {
      if (isEdit) {
        // Remove assignedToUserId from update payload since backend doesn't support it directly
        delete payload.assignedToUserId;
        
        await updateTask.mutateAsync({ id: id as string, data: payload as any });
        
        const oldAssigneeId = task?.assignments?.[0]?.userId || task?.assignee?.id || task?.assigneeId;
        const newAssigneeId = data.assigneeId;
        
        // Handle assignment changes if they differ
        if (newAssigneeId !== oldAssigneeId) {
          if (oldAssigneeId) {
            await unassignTask.mutateAsync({ id: id as string });
          }
          if (newAssigneeId) {
            await assignTask.mutateAsync({ id: id as string, userId: newAssigneeId });
          }
        }
        
        navigate(`/tasks/${id}`);
      } else {
        await createTask.mutateAsync(payload as any);
        navigate('/tasks');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isEdit && isLoadingTask) {
    return <PageWrapper><LoadingSpinner size={48} /></PageWrapper>;
  }

  console.log('usersData in TaskFormPage:', usersData);

  return (
    <PageWrapper>
      <button 
        onClick={() => navigate('/tasks')}
        className="flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tasks
      </button>

      <PageHeader 
        title={isEdit ? 'Edit Task' : 'Create Task'} 
        description={isEdit ? 'Update the task details below.' : 'Add a new task to a project.'}
      />

      <Card className="card-3d bg-slate-900 border-slate-700 max-w-3xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Task Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                {...register('name')}
                className="bg-slate-950 border-slate-700 text-white"
                placeholder="e.g. Design Homepage"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                className="bg-slate-950 border-slate-700 text-white min-h-[100px]"
                placeholder="Task details and acceptance criteria..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Project <span className="text-red-500">*</span></Label>
                <Controller
                  name="projectId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingProjects}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select project"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 max-h-60">
                        {projectsData?.items.map((proj: any) => (
                          <SelectItem key={proj.id} value={proj.id} className="text-slate-200 focus:bg-slate-800 focus:text-white">
                            {proj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.projectId && <p className="text-sm text-red-500">{errors.projectId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Priority <span className="text-red-500">*</span></Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-slate-200 focus:bg-slate-800 focus:text-white">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Assignee</Label>
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(val === 'unassigned' ? undefined : val)} value={field.value || 'unassigned'} disabled={isLoadingUsers}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder={isLoadingUsers ? "Loading..." : "Select employee"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 max-h-60">
                        <SelectItem value="unassigned" className="text-slate-400">Unassigned</SelectItem>
                        {(Array.isArray(usersData) ? usersData : usersData?.items || []).map((user: any) => (
                          <SelectItem key={user.id} value={user.id} className="text-slate-200 focus:bg-slate-800 focus:text-white">
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Deadline</Label>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-950 border-slate-700 text-white hover:bg-slate-900",
                            !field.value && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours" className="text-slate-300">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('estimatedHours', { valueAsNumber: true })}
                  className="bg-slate-950 border-slate-700 text-white"
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-slate-700 text-slate-300 hover:text-white bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                {isSubmitting ? <LoadingSpinner size={16} className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isEdit ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
