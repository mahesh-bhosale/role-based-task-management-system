import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProject, useCreateProject, useUpdateProject } from '../../hooks/useProjects';
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
import { PROJECT_STATUS_LABELS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  managerId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: project, isLoading: isLoadingProject } = useProject(id || '');
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ role: 'PROJECT_MANAGER' });
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'PLANNING',
    }
  });

  useEffect(() => {
    if (isEdit && project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        managerId: project.managerId || '',
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
      });
    }
  }, [isEdit, project, reset]);

  const onSubmit = async (data: ProjectFormValues) => {
    const payload = {
      ...data,
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
    };

    if (isEdit) {
      await updateProject.mutateAsync({ id, data: payload as any });
      navigate(`/projects/${id}`);
    } else {
      await createProject.mutateAsync(payload as any);
      navigate('/projects');
    }
  };

  if (isEdit && isLoadingProject) {
    return <PageWrapper><LoadingSpinner size={48} /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <button 
        onClick={() => navigate('/projects')}
        className="flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
      </button>

      <PageHeader 
        title={isEdit ? 'Edit Project' : 'Create Project'} 
        description={isEdit ? 'Update the project details below.' : 'Add a new project to the system.'}
      />

      <Card className="card-3d bg-slate-900 border-slate-700 max-w-3xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Project Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                {...register('name')}
                className="bg-slate-950 border-slate-700 text-white"
                placeholder="e.g. Website Redesign"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                className="bg-slate-950 border-slate-700 text-white min-h-[100px]"
                placeholder="Project goals and details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Status <span className="text-red-500">*</span></Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-slate-200 focus:bg-slate-800 focus:text-white">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Project Manager</Label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(val === 'unassigned' ? undefined : val)} value={field.value || 'unassigned'} disabled={isLoadingUsers}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder={isLoadingUsers ? "Loading..." : "Select a manager"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="unassigned" className="text-slate-400">Unassigned</SelectItem>
                        {usersData?.items.map((user: any) => (
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
                <Label className="text-slate-300">Start Date</Label>
                <Controller
                  name="startDate"
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
                <Label className="text-slate-300">End Date</Label>
                <Controller
                  name="endDate"
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
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-slate-700 text-slate-300 hover:text-white bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                {isSubmitting ? <LoadingSpinner size={16} className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isEdit ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
