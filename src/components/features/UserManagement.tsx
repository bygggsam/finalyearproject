
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { 
  Users, 
  Plus, 
  Search,
  Shield,
  UserCheck,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'records_officer' | 'analyst';
  department?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  documentsProcessed: number;
  username: string;
  created_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading users from database...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading users:', error);
        toast({
          title: '❌ Error Loading Users',
          description: error.message || 'Failed to load users from database',
          variant: 'destructive'
        });
        return;
      }

      console.log('📊 Raw user data from database:', data);

      // Count documents for each user
      const usersWithDocCounts = await Promise.all(
        (data || []).map(async (user) => {
          try {
            const { count } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('created_by', user.id);

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department || 'Not specified',
              status: 'active' as const,
              lastLogin: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
              documentsProcessed: count || 0,
              username: user.username,
              created_at: user.created_at
            };
          } catch (docError) {
            console.error('⚠️ Error counting documents for user', user.id, ':', docError);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department || 'Not specified',
              status: 'active' as const,
              lastLogin: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
              documentsProcessed: 0,
              username: user.username,
              created_at: user.created_at
            };
          }
        })
      );

      setUsers(usersWithDocCounts);
      console.log('✅ Successfully loaded', usersWithDocCounts.length, 'users');
      
      toast({
        title: '✅ Users Loaded',
        description: `Successfully loaded ${usersWithDocCounts.length} users`,
      });
    } catch (error) {
      console.error('❌ Unexpected error loading users:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Administrator', icon: Shield },
      doctor: { color: 'bg-blue-100 text-blue-800', label: 'Doctor', icon: UserCheck },
      records_officer: { color: 'bg-green-100 text-green-800', label: 'Records Officer', icon: CheckCircle },
      analyst: { color: 'bg-orange-100 text-orange-800', label: 'Data Analyst', icon: Users }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) {
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Unknown Role
        </Badge>
      );
    }
    
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      : <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Inactive
        </Badge>;
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '📋 Account Creation Instructions',
      description: `To create an account for ${newUser.name}, they must use the Sign Up form with their email: ${newUser.email} and select role: ${newUser.role}`,
    });

    setNewUser({ name: '', email: '', role: '', department: '' });
    setShowAddUser(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = {
    doctors: users.filter(u => u.role === 'doctor').length,
    records_officers: users.filter(u => u.role === 'records_officer').length,
    analysts: users.filter(u => u.role === 'analyst').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.status === 'active').length
  };

  // Check if current user has admin privileges
  const canManageUsers = currentUser?.role === 'admin';

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6">
          <CardContent className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              You need administrator privileges to access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddUser(!showAddUser)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <Card>
          <CardHeader>
            <CardTitle>Add New User Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role *</label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="records_officer">Records Officer</SelectItem>
                    <SelectItem value="analyst">Data Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  placeholder="Enter department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Users must create their own accounts through the Sign Up form. 
                This form helps you plan user access and provides the information they'll need.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>
                Generate Instructions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-3xl font-bold text-purple-900">{roleStats.admins}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doctors</p>
                <p className="text-3xl font-bold text-blue-900">{roleStats.doctors}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Records Officers</p>
                <p className="text-3xl font-bold text-green-900">{roleStats.records_officers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Analysts</p>
                <p className="text-3xl font-bold text-orange-900">{roleStats.analysts}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-teal-900">{roleStats.active}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              System Users ({filteredUsers.length})
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-teal-100 p-2 rounded-full">
                      <UserCheck className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last login: {user.lastLogin}</p>
                    <p className="text-sm text-gray-500">{user.documentsProcessed} documents processed</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
