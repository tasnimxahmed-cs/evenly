'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  CreditCard, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Trash2, 
  LogOut, 
  Settings, 
  Building2, 
  Phone,
  Save,
  X,
  Edit3
} from "lucide-react";

interface BankAccount {
  id: string;
  institution: string;
  accountName: string;
  accountType: string;
  mask?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Helper function to detect OAuth accounts
  const isOAuthAccount = () => {
    // Check if user has external accounts (OAuth providers)
    const hasExternalAccounts = user?.externalAccounts && user.externalAccounts.length > 0;
    // Check if password is not enabled (typical for OAuth accounts)
    const noPassword = !user?.passwordEnabled;
    
    return hasExternalAccounts || noPassword;
  };

  useEffect(() => {
    if (isLoaded && userId) {
      fetchBankAccounts();
      if (user) {
        setProfileData({
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.emailAddresses[0]?.emailAddress || '',
          phone: user.phoneNumbers[0]?.phoneNumber || ''
        });
      }
    }
  }, [isLoaded, userId, user]);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update profile in Clerk
      await user?.update({
        firstName: profileData.name.split(' ')[0] || '',
        lastName: profileData.name.split(' ').slice(1).join(' ') || '',
      });

      // Note: Email updates in Clerk require additional verification
      // For now, we'll just show a success message
      if (profileData.email !== user?.emailAddresses[0]?.emailAddress) {
        setSuccess('Profile updated! Email changes require verification through Clerk. Please check your email for verification.');
      } else {
        setSuccess('Profile updated successfully!');
      }

      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      // Delete user data from our database
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account data');
      }

      // Delete Clerk user account
      await user?.delete();

      // Redirect to landing page
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!userId || !user) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and connected services.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Manage your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Editing Mode:</strong> You can edit your name and email. Phone number editing requires Clerk Pro.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                                 <div>
                   <label className="block text-sm font-medium mb-2">Email</label>
                   <Input
                     type="email"
                     value={profileData.email}
                     onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                     placeholder="Enter your email address"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Email changes will be updated in Clerk
                   </p>
                 </div>
                                 <div>
                   <label className="block text-sm font-medium mb-2">Phone Number</label>
                   <Input
                     type="tel"
                     value={profileData.phone}
                     onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                     placeholder="Enter your phone number"
                     disabled
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Phone number support requires Clerk Pro subscription
                   </p>
                 </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleProfileSave} 
                    disabled={saving}
                    className="flex items-center gap-2"
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
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileData({
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                        email: user.emailAddresses[0]?.emailAddress || '',
                        phone: user.phoneNumbers[0]?.phoneNumber || ''
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingProfile(true)}
                    className="cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingProfile(true)}
                    className="cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                                 <div className="flex items-center justify-between py-2">
                   <div>
                     <p className="font-medium">Phone Number</p>
                     <p className="text-sm text-muted-foreground">
                       {user.phoneNumbers[0]?.phoneNumber || 'Not set'}
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       Phone number support requires Clerk Pro
                     </p>
                   </div>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => {
                       setError('Phone number editing requires Clerk Pro subscription');
                     }}
                     className="cursor-pointer"
                   >
                     <Phone className="h-4 w-4 mr-1" />
                     {user.phoneNumbers[0]?.phoneNumber ? 'Edit' : 'Add'}
                   </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Accounts
            </CardTitle>
            <CardDescription>
              Connect your bank accounts to automatically import transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bank accounts connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your bank accounts to automatically import and categorize transactions.
                </p>
                <Button asChild className="cursor-pointer">
                  <Link href="/dashboard/bank-accounts" className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Connect Bank Account
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.accountName} • {account.accountType}
                        {account.mask && ` • ****${account.mask}`}
                      </p>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="cursor-pointer">
                  <Link href="/dashboard/bank-accounts" className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Accounts
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="flex items-center justify-between py-2">
               <div>
                 <p className="font-medium">Two-Factor Authentication</p>
                 <p className="text-sm text-muted-foreground">
                   Add an extra layer of security to your account
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   Coming soon
                 </p>
               </div>
               <Button variant="outline" size="sm" className="cursor-pointer" disabled>
                 Enable
               </Button>
             </div>
             <div className="flex items-center justify-between py-2">
               <div>
                 <p className="font-medium">Password</p>
                 <p className="text-sm text-muted-foreground">
                   Change your account password
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   {isOAuthAccount() ? 'OAuth account - no password set' : 'Manage through Clerk'}
                 </p>
               </div>
               <Button variant="outline" size="sm" className="cursor-pointer" disabled>
                 Change
               </Button>
             </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications about transactions and settlements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="flex items-center justify-between py-2">
               <div>
                 <p className="font-medium">Push Notifications</p>
                 <p className="text-sm text-muted-foreground">
                   Receive notifications on your mobile device
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   Coming soon
                 </p>
               </div>
               <Button variant="outline" size="sm" className="cursor-pointer" disabled>
                 Configure
               </Button>
             </div>
             <div className="flex items-center justify-between py-2">
               <div>
                 <p className="font-medium">Email Notifications</p>
                 <p className="text-sm text-muted-foreground">
                   Receive notifications via email
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   Coming soon
                 </p>
               </div>
               <Button variant="outline" size="sm" className="cursor-pointer" disabled>
                 Configure
               </Button>
             </div>
             <div className="flex items-center justify-between py-2">
               <div>
                 <p className="font-medium">SMS Notifications</p>
                 <p className="text-sm text-muted-foreground">
                   Receive notifications via text message
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   Coming soon
                 </p>
               </div>
               <Button variant="outline" size="sm" className="cursor-pointer" disabled>
                 Configure
               </Button>
             </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your Evenly experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="flex items-center justify-between py-2">
               <div>
                 <p className="font-medium">Theme</p>
                 <p className="text-sm text-muted-foreground">
                   Choose between light, dark, or system theme
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   Coming soon
                 </p>
               </div>
               <Button variant="outline" size="sm" className="cursor-pointer" disabled>
                 Configure
               </Button>
             </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="cursor-pointer"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
