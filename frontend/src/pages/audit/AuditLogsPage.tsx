import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useUsers } from '../../hooks/useUsers';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';

const ACTION_TYPES = [
  'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_DELETE',
  'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE',
  'WORKLOG_SUBMIT', 'USER_CREATE', 'USER_UPDATE'
];

const ENTITY_TYPES = ['PROJECT', 'TASK', 'WORKLOG', 'USER'];

export const AuditLogsPage: React.FC = () => {
  const [userId, setUserId] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [entity, setEntity] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: usersData } = useUsers({ limit: 100 });
  
  const queryParams: Record<string, any> = { limit: 100 };
  if (userId !== 'all') queryParams.userId = userId;
  if (action !== 'all') queryParams.action = action;
  if (entity !== 'all') queryParams.entity = entity;
  if (dateFrom) queryParams.dateFrom = new Date(dateFrom).toISOString();
  if (dateTo) queryParams.dateTo = new Date(dateTo).toISOString();

  const { data: auditData, isLoading } = useAuditLogs(queryParams);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getActionColor = (actionName: string) => {
    if (actionName.includes('CREATE')) return 'bg-green-600';
    if (actionName.includes('UPDATE')) return 'bg-blue-600';
    if (actionName.includes('DELETE')) return 'bg-red-600';
    if (actionName.includes('SUBMIT')) return 'bg-purple-600';
    return 'bg-slate-600';
  };

  return (
    <PageWrapper title="Audit Logs" description="Track system-wide changes and activity history.">
      <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <CardTitle>Activity Log</CardTitle>
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

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[150px] border-2 border-slate-700 bg-slate-800">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_TYPES.map(a => (
                  <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-[150px] border-2 border-slate-700 bg-slate-800">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITY_TYPES.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
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
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border-2 border-slate-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800">
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditData?.items.map(log => (
                      <React.Fragment key={log.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-slate-800/50"
                          onClick={() => toggleRow(log.id)}
                        >
                          <TableCell>
                            {expandedRow === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium text-slate-200">
                            {log.user?.name || 'System / Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getActionColor(log.action)} text-white border-0`}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-300">{log.entity}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-400">...{log.entityId.slice(-8)}</TableCell>
                          <TableCell className="text-slate-400 whitespace-nowrap">
                            {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                        </TableRow>
                        
                        {expandedRow === log.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan={6} className="p-0 border-b-2 border-slate-700">
                              <div className="p-4 pl-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="flex items-center text-sm font-semibold text-slate-300">
                                      <Code className="h-4 w-4 mr-2" />
                                      Previous Value
                                    </h4>
                                    <div className="bg-[#0d1117] p-3 rounded border border-slate-700 overflow-x-auto">
                                      <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap break-all">
                                        {log.previousValue ? JSON.stringify(log.previousValue, null, 2) : 'null'}
                                      </pre>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="flex items-center text-sm font-semibold text-slate-300">
                                      <Code className="h-4 w-4 mr-2" />
                                      New Value
                                    </h4>
                                    <div className="bg-[#0d1117] p-3 rounded border border-slate-700 overflow-x-auto">
                                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                                        {log.newValue ? JSON.stringify(log.newValue, null, 2) : 'null'}
                                      </pre>
                                    </div>
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
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default AuditLogsPage;
