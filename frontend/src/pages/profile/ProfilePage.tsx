import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { UserCircle, Mail, Shield, Calendar } from 'lucide-react';
import { roleLabel, roleBadgeColor, formatDateTime } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <PageWrapper>
      <PageHeader 
        title="My Profile" 
        description="View your account details and role permissions."
      />

      <div className="max-w-2xl mt-6">
        <Card className="card-3d bg-slate-900 border-slate-700">
          <CardHeader className="border-b border-slate-800 pb-6 flex flex-row items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300">
              <UserCircle className="h-12 w-12" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">{user.name}</CardTitle>
              <div className="mt-2">
                <Badge variant="outline" className={`${roleBadgeColor(user.role)}`}>
                  {roleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email Address
                </div>
                <div className="text-slate-200">{user.email}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Account Role
                </div>
                <div className="text-slate-200">{roleLabel(user.role)}</div>
              </div>
              {user.createdAt && (
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Member Since
                  </div>
                  <div className="text-slate-200">{formatDateTime(user.createdAt)}</div>
                </div>
              )}
            </div>
            
            <div className="pt-4 mt-6 border-t border-slate-800">
              <Button disabled className="w-full sm:w-auto bg-slate-800 text-slate-400 border border-slate-700">
                Edit Profile (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};
