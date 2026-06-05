import React, { useState } from 'react';
import { useWorklogs, useAddReply } from '../../hooks/useWorklogs';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { format } from 'date-fns';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { ChevronDown, ChevronRight, MessageSquare, Paperclip, Send } from 'lucide-react';

export const WorkLogsPage: React.FC = () => {
  const [userId, setUserId] = useState<string>('all');
  const [projectId, setProjectId] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const { data: usersData } = useUsers({ limit: 100 });
  const { data: projectsData } = useProjects({ limit: 100 });
  
  const queryParams: Record<string, any> = { limit: 100 };
  if (userId !== 'all') queryParams.userId = userId;
  if (projectId !== 'all') queryParams.projectId = projectId;
  if (dateFrom) queryParams.dateFrom = new Date(dateFrom).toISOString();
  if (dateTo) queryParams.dateTo = new Date(dateTo).toISOString();

  const { data: worklogsData, isLoading } = useWorklogs(queryParams);
  const addReply = useAddReply();

  const handleReplySubmit = (workLogId: string) => {
    if (!replyMessage.trim()) return;
    addReply.mutate(
      { workLogId, message: replyMessage },
      {
        onSuccess: () => {
          setReplyMessage('');
        }
      }
    );
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const totalHours = worklogsData?.items.reduce((sum, log) => sum + log.hoursWorked, 0) || 0;

  return (
    <PageWrapper title="Work Logs" description="Review employee time tracking and activity">
      <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <CardTitle>Time Logs</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="w-[150px] border-2 border-slate-700 bg-slate-800">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {usersData?.items.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-[150px] border-2 border-slate-700 bg-slate-800">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projectsData?.items.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)}
              className="w-[150px] border-2 border-slate-700 bg-slate-800"
              title="Date From"
            />
            <Input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)}
              className="w-[150px] border-2 border-slate-700 bg-slate-800"
              title="Date To"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border-2 border-slate-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800">
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Attachment</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {worklogsData?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-400">
                        No work logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    worklogsData?.items.map(log => (
                      <React.Fragment key={log.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-slate-800/50"
                          onClick={() => toggleRow(log.id)}
                        >
                          <TableCell>
                            {expandedRow === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">{log.user?.name}</TableCell>
                          <TableCell>{log.task?.name}</TableCell>
                          <TableCell>{log.task?.project?.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={log.description}>
                            {log.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-900/50 text-blue-200 border border-blue-800">
                              {log.hoursWorked}h
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.attachmentUrl ? (
                              <a 
                                href={log.attachmentUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center text-slate-300 hover:text-white"
                              >
                                <Paperclip className="h-4 w-4 mr-1" /> File
                              </a>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 whitespace-nowrap">
                            {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                          </TableCell>
                        </TableRow>
                        
                        {expandedRow === log.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan={8} className="p-0 border-b-2 border-slate-700">
                              <div className="p-4 pl-12 space-y-4">
                                <div className="text-sm text-slate-300 whitespace-pre-wrap">
                                  <strong className="text-slate-100">Full Description:</strong><br />
                                  {log.description}
                                </div>
                                
                                <div className="space-y-2 mt-4">
                                  <h4 className="flex items-center text-sm font-semibold text-slate-200">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Replies ({log.replies?.length || 0})
                                  </h4>
                                  
                                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {log.replies?.map(reply => (
                                      <div key={reply.id} className="bg-slate-800 p-3 rounded-md border border-slate-700">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-medium text-sm text-blue-300">{reply.user?.name}</span>
                                          <span className="text-xs text-slate-500">
                                            {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                                          </span>
                                        </div>
                                        <p className="text-sm text-slate-300">{reply.message}</p>
                                      </div>
                                    ))}
                                    {(!log.replies || log.replies.length === 0) && (
                                      <div className="text-sm text-slate-500 italic">No replies yet.</div>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2 mt-2">
                                    <Input 
                                      value={replyMessage}
                                      onChange={e => setReplyMessage(e.target.value)}
                                      placeholder="Add a reply..." 
                                      className="border-slate-700 bg-slate-800 flex-1"
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          handleReplySubmit(log.id);
                                        }
                                      }}
                                    />
                                    <Button 
                                      onClick={() => handleReplySubmit(log.id)}
                                      disabled={addReply.isPending || !replyMessage.trim()}
                                      className="border-2 border-blue-900 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 transition-transform"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Reply
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
              {worklogsData?.items.length ? (
                <div className="bg-slate-800 p-3 border-t-2 border-slate-700 flex justify-end font-semibold">
                  <span className="mr-4">Total Hours Filtered:</span>
                  <Badge variant="secondary" className="bg-blue-600 text-white">{totalHours.toFixed(1)}h</Badge>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default WorkLogsPage;
