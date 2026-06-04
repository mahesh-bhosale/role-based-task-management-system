import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTask, useUpdateTask } from '../../hooks/useTasks';
import { useTaskWorklogs, useCreateWorklog, useAddReply } from '../../hooks/useWorklogs';
import { useUsers } from '../../hooks/useUsers';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, History, UserCircle, Download, Send, Play } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { ROLES, TASK_STATUS_LABELS } from '../../lib/constants';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: task, isLoading: isTaskLoading } = useTask(id || '');
  const { data: worklogsData, isLoading: isWorklogsLoading } = useTaskWorklogs(id || '');
  const updateTask = useUpdateTask();

  const [isAssigneeDialogOpen, setIsAssigneeDialogOpen] = useState(false);
  
  if (isTaskLoading) return <PageWrapper><LoadingSpinner size={48} /></PageWrapper>;
  if (!task) return <PageWrapper><div className="text-red-500">Task not found.</div></PageWrapper>;

  const canEditTask = user?.role === ROLES.ADMIN || user?.role === ROLES.PROJECT_MANAGER;
  const isAssignee = task.assignee?.id === user?.id;
  const canChangeStatus = canEditTask || isAssignee;

  const handleStatusChange = async (newStatus: string) => {
    await updateTask.mutateAsync({ id: task.id, data: { status: newStatus as any } });
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED';

  return (
    <PageWrapper>
      <button 
        onClick={() => navigate('/tasks')}
        className="flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tasks
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{task.name}</h1>
            <PriorityBadge priority={task.priority} />
            {canChangeStatus ? (
              <Select defaultValue={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] h-8 bg-slate-900 border-slate-700 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-slate-200 focus:bg-slate-800">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <StatusBadge status={task.status} type="task" />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span>Project: <span className="text-primary hover:underline cursor-pointer" onClick={() => navigate(`/projects/${task.project?.id}`)}>{task.project?.name}</span></span>
            {task.deadline && (
              <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                Deadline: {formatDateTime(task.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-3d bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          {/* Work Logs Section */}
          <Card className="card-3d bg-slate-900 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Work Logs</CardTitle>
              {user?.role === ROLES.EMPLOYEE && isAssignee && (
                <LogWorkDialog taskId={task.id} />
              )}
            </CardHeader>
            <CardContent>
              {isWorklogsLoading ? <LoadingSpinner /> : (
                <div className="space-y-6">
                  {worklogsData?.items?.map((log: any) => (
                    <WorkLogItem key={log.id} log={log} canReply={canEditTask} />
                  ))}
                  {(!worklogsData?.items || worklogsData.items.length === 0) && (
                    <p className="text-center text-slate-500 py-6">No work logs recorded yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-3d bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-sm text-slate-400">Assignee</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{task.assignee?.name || 'Unassigned'}</span>
                  {canEditTask && (
                    <ChangeAssigneeDialog 
                      taskId={task.id} 
                      currentAssignee={task.assigneeId || ''} 
                      open={isAssigneeDialogOpen}
                      onOpenChange={setIsAssigneeDialogOpen}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-sm text-slate-400">Estimated Hours</span>
                <span className="text-sm font-medium text-white">{task.estimatedHours || 0}h</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-sm text-slate-400">Created By</span>
                <span className="text-sm font-medium text-white">{task.createdBy?.name || 'System'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-400">Created At</span>
                <span className="text-sm font-medium text-white">{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="h-4 w-4" /> Task History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {task.auditLogs?.map((log: any) => (
                  <div key={log.id} className="text-sm">
                    <p className="text-slate-300">
                      <span className="font-semibold text-white">{log.user?.name || 'System'}</span> {log.action.replace(/_/g, ' ').toLowerCase()} this task.
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))}
                {(!task.auditLogs || task.auditLogs.length === 0) && (
                  <p className="text-sm text-slate-500">No history available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

const WorkLogItem = ({ log, canReply }: { log: any; canReply: boolean }) => {
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const addReply = useAddReply();

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    await addReply.mutateAsync({ workLogId: log.id, message: replyText });
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
        <UserCircle className="h-8 w-8 text-slate-500 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <div>
              <span className="font-semibold text-white mr-2">{log.user?.name}</span>
              <span className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</span>
            </div>
            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded">
              {log.hoursWorked}h
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-2">{log.description}</p>
          
          {log.attachmentUrl && (
            <a href={log.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3">
              <Download className="h-3 w-3" /> View Attachment
            </a>
          )}

          <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-700/50">
            {log.replies?.map((reply: any) => (
              <div key={reply.id} className="text-sm">
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-200">{reply.user?.name}</span>: {reply.message}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(reply.createdAt)}</p>
              </div>
            ))}

            {canReply && (
              <div className="mt-2">
                {!isReplying ? (
                  <button onClick={() => setIsReplying(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Send className="h-3 w-3" /> Reply
                  </button>
                ) : (
                  <div className="flex gap-2 items-center mt-2">
                    <Input 
                      size={1}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply..." 
                      className="h-8 text-xs bg-slate-900 border-slate-700 text-white"
                    />
                    <Button size="sm" onClick={handleReplySubmit} className="h-8 px-3" disabled={addReply.isPending}>Send</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)} className="h-8 px-2 text-slate-400">Cancel</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogWorkDialog = ({ taskId }: { taskId: string }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const createWorklog = useCreateWorklog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('description', description);
    formData.append('hoursWorked', hours);
    if (file) formData.append('attachment', file);
    
    await createWorklog.mutateAsync({ taskId, data: formData });
    setOpen(false);
    setDescription('');
    setHours('');
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-vividYellow hover:bg-vividYellow/90 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
          <Play className="h-4 w-4 mr-1" /> Log Work
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Log Work</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Hours Worked</Label>
            <Input 
              type="number" 
              step="0.1" 
              min="0.1" 
              required
              value={hours}
              onChange={e => setHours(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea 
              required
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white min-h-[100px]" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Attachment (Optional)</Label>
            <Input 
              type="file" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="bg-slate-950 border-slate-700 text-slate-300 cursor-pointer" 
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createWorklog.isPending} className="bg-primary hover:bg-primary/90">
              {createWorklog.isPending ? 'Submitting...' : 'Submit Work Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ChangeAssigneeDialog = ({ taskId, currentAssignee, open, onOpenChange }: any) => {
  const { data: usersData, isLoading } = useUsers({ role: 'EMPLOYEE', limit: 100 });
  const updateTask = useUpdateTask();
  const [newAssignee, setNewAssignee] = useState(currentAssignee);

  const handleSave = async () => {
    if (newAssignee !== currentAssignee) {
      await updateTask.mutateAsync({ id: taskId, data: { assigneeId: newAssignee } as any });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:bg-primary/10 px-2">Change</Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Change Assignee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Select value={newAssignee} onValueChange={setNewAssignee} disabled={isLoading}>
            <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="" className="text-slate-400">Unassigned</SelectItem>
              {usersData?.items.map((u: any) => (
                <SelectItem key={u.id} value={u.id} className="text-slate-200">{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateTask.isPending || newAssignee === currentAssignee}>
              Save Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
