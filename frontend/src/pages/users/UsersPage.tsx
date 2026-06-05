import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { useUsers, useUpdateUser, useDeactivateUser } from '../../hooks/useUsers';
import { UserFormDialog } from '../../components/users/UserFormDialog';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useToast } from '../../hooks/use-toast';
import { User } from '../../types/api.types';
import { UserPlus, Edit2, ShieldAlert, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  
  const { data: usersData, isLoading } = useUsers({ limit: 100 });
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeactivateUser();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setUserToEdit(null);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (user: User) => {
    setUpdatingUserId(user.id);
    updateUser(
      { id: user.id, data: { isActive: !user.isActive } },
      { 
        onSettled: () => setUpdatingUserId(null),
        onSuccess: () => {
          toast({ title: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully.` });
        },
        onError: () => {
          toast({ title: `Failed to update user status.`, variant: 'destructive' });
        }
      }
    );
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id, {
        onSuccess: () => {
          toast({ title: 'User deleted successfully.' });
          setUserToDelete(null);
        },
        onError: () => {
          toast({ title: 'Failed to delete user.', variant: 'destructive' });
          setUserToDelete(null);
        }
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return <Badge className="bg-red-900/50 text-red-300 border-red-800">Admin</Badge>;
      case 'PROJECT_MANAGER': return <Badge className="bg-purple-900/50 text-purple-300 border-purple-800">Manager</Badge>;
      case 'EMPLOYEE': return <Badge className="bg-blue-900/50 text-blue-300 border-blue-800">Employee</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  return (
    <PageWrapper title="User Management" description="Manage access controls, roles, and employee profiles.">
      <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>System Users</CardTitle>
          <Button 
            onClick={handleCreateClick}
            className="bg-blue-600 text-white font-bold shadow-[4px_4px_0px_0px_#1e3a8a] hover:bg-blue-500 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1e3a8a] transition-all border-2 border-blue-800"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="rounded-md border-2 border-slate-700 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-slate-800">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.items.map(user => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-9 w-9 border-2 border-slate-700">
                              <AvatarFallback className="bg-slate-800 text-slate-300">
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-slate-200">
                                {user.name} {isSelf && <span className="text-xs text-blue-400 ml-1">(You)</span>}
                              </div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <span className="flex items-center text-green-400 text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center text-slate-500 text-xs font-medium">
                              <XCircle className="w-3 h-3 mr-1" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-400 font-medium">{user.taskCount || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleToggleActive(user)}
                              disabled={isSelf || (isUpdating && updatingUserId === user.id)}
                              className={`border-slate-700 bg-slate-800 hover:bg-slate-700 ${!user.isActive ? 'text-green-400 hover:text-green-300' : 'text-slate-400 hover:text-red-400'}`}
                              title={user.isActive ? "Deactivate" : "Activate"}
                            >
                              {isUpdating && updatingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ShieldAlert className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditClick(user)}
                              className="border-slate-700 bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-blue-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setUserToDelete(user)}
                              disabled={isSelf}
                              className="border-slate-700 bg-slate-800 text-red-400 hover:bg-slate-700 hover:text-red-300"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {usersData?.items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-6">No users found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        userToEdit={userToEdit} 
      />

      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        variant="destructive"
        isLoading={isDeleting}
      />
    </PageWrapper>
  );
};

export default UsersPage;
