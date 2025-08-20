import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CreditCard, User, Bell, Shield, Palette, Trash2, LogOut, Settings, Building2 } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/auth/signin");
  }

  // Fetch user's bank accounts
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    select: {
      id: true,
      institution: true,
      accountName: true,
      accountType: true,
      mask: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and connected services.
        </p>
      </div>

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
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">
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
              <Button variant="outline" size="sm" className="cursor-pointer">
                Change
              </Button>
            </div>
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
                  <Link href="/dashboard/bank-accounts">
                    Connect Bank Account
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {bankAccounts.length} connected account{bankAccounts.length !== 1 ? 's' : ''}
                  </p>
                  <Button asChild variant="outline" size="sm" className="cursor-pointer">
                    <Link href="/dashboard/bank-accounts">
                      Manage Accounts
                    </Link>
                  </Button>
                </div>
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{account.institution}</h3>
                          <p className="text-sm text-muted-foreground">
                            {account.accountName} • {account.accountType}
                            {account.mask && ` • ****${account.mask}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about settlements and circle activities
                </p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get instant alerts for new transactions and settlements
                </p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">
                Configure
              </Button>
            </div>
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
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Change your account password
                </p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">
                Change
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
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer">
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
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
