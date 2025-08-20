'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  UserMinus, 
  Users,
  Settings,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CircleData {
  id: string;
  name: string;
  description?: string;
  color?: string;
  members: {
    id: string;
    role: 'ADMIN' | 'MEMBER';
    user: User;
  }[];
}

export default function CircleSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
    '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#84cc16'
  ];

  useEffect(() => {
    fetchCircleData();
  }, [circleId]);

  const fetchCircleData = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}`);
      if (!response.ok) throw new Error('Failed to fetch circle data');
      const data = await response.json();
      setCircle(data);
      
      // Set form values
      setName(data.name);
      setDescription(data.description || '');
      setColor(data.color || '#6366f1');
    } catch (error) {
      console.error('Error fetching circle data:', error);
      setError('Failed to load circle data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/circles/${circleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        }),
      });

      if (!response.ok) throw new Error('Failed to update circle');

      // Refresh circle data
      await fetchCircleData();
      
      // Show success message
      setSuccessMessage('Circle settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating circle:', error);
      setError('Failed to update circle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCircle = async () => {
    if (!confirm('Are you sure you want to delete this circle? This action cannot be undone and will delete all transactions.')) {
      return;
    }

    try {
      const response = await fetch(`/api/circles/${circleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete circle');

      router.push('/dashboard/circles');
    } catch (error) {
      console.error('Error deleting circle:', error);
      setError('Failed to delete circle');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this circle?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/circles/${circleId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');

      fetchCircleData(); // Refresh the list
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const handleLeaveCircle = async () => {
    if (!confirm('Are you sure you want to leave this circle?')) {
      return;
    }

    try {
      const response = await fetch(`/api/circles/${circleId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to leave circle');

      router.push('/dashboard/circles');
    } catch (error) {
      console.error('Error leaving circle:', error);
      setError('Failed to leave circle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading circle settings...</p>
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Circle not found</p>
      </div>
    );
  }

  // For now, we'll assume the first member is the current user
  // In a real implementation, you'd get this from Clerk auth
  const currentUser = circle.members[0];
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Circle Settings</h1>
          <p className="text-muted-foreground">Manage {circle.name} settings and members</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Circle Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Circle Information
            </CardTitle>
            <CardDescription>
              Update your circle's name, description, and appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Circle name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      color === colorOption 
                        ? 'border-foreground scale-110' 
                        : 'border-muted hover:border-foreground/50'
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/circles/${circleId}`)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                View Circle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({circle.members.length})
            </CardTitle>
            <CardDescription>
              Manage circle members and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {circle.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                    {isAdmin && member.role !== 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMember(member.id, member.user.name)}
                        className="text-destructive hover:text-destructive cursor-pointer"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isAdmin && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-yellow-800 text-sm">
                    Only admins can manage members and circle settings
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin ? (
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <h4 className="font-medium text-red-600">Delete Circle</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this circle and all its transactions
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteCircle}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Delete Circle
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <h4 className="font-medium text-red-600">Leave Circle</h4>
                <p className="text-sm text-muted-foreground">
                  Leave this circle and remove yourself from all transactions
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleLeaveCircle}
                className="flex items-center gap-2 cursor-pointer"
              >
                <UserMinus className="h-4 w-4" />
                Leave Circle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
