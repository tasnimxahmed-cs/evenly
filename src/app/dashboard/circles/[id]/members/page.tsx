"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  UserPlus, 
  Mail, 
  Copy, 
  Users, 
  Crown,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface Circle {
  id: string;
  name: string;
  color: string;
  members: Member[];
}

export default function CircleMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [circleId, setCircleId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params;
      setCircleId(id);
      await fetchCircleData(id);
    };
    loadData();
  }, [params]);

  const fetchCircleData = async (id: string) => {
    try {
      const response = await fetch(`/api/circles/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch circle data');
      }
      const data = await response.json();
      setCircle(data);
    } catch (error) {
      console.error('Error fetching circle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const response = await fetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      setInviteEmail("");
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const generateInviteLink = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}/invite-link`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate invite link');
      }

      const data = await response.json();
      setInviteLink(data.inviteLink);
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Failed to generate invite link');
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy invite link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading circle...</p>
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Circle not found</p>
        <Button asChild className="mt-4 cursor-pointer">
          <Link href="/dashboard/circles">Back to Circles</Link>
        </Button>
      </div>
    );
  }

  const currentUser = circle.members.find(member => member.user.id === 'current-user-id'); // This would come from auth
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" asChild className="cursor-pointer">
            <Link href={`/dashboard/circles/${circle.id}`} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Circle
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: circle.color || "#6366f1" }}
          >
            {circle.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{circle.name} - Members</h1>
            <p className="text-muted-foreground">
              Manage circle members and send invitations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Current Members */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Current Members ({circle.members.length})</h2>
          
          <div className="rounded-lg border bg-card">
            <div className="p-4 space-y-3">
              {circle.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.role === 'ADMIN' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.role === 'ADMIN' ? (
                        <span className="flex items-center">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        'Member'
                      )}
                    </span>
                    {member.user.id === 'current-user-id' && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invite Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Invite New Members</h2>
          
          {/* Email Invite */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-medium mb-4">Invite by Email</h3>
            <form onSubmit={handleInviteByEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isInviting || !inviteEmail.trim()}
                className="w-full cursor-pointer"
              >
                {isInviting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Invite Link */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-medium mb-4">Invite Link</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with friends to let them join your circle directly.
            </p>
            
            {inviteLink ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-muted text-foreground text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInviteLink}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can join your circle
                </p>
              </div>
            ) : (
              <Button onClick={generateInviteLink} className="w-full cursor-pointer">
                <UserPlus className="h-4 w-4 mr-2" />
                Generate Invite Link
              </Button>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-medium mb-3">Tips for inviting members:</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Send email invitations to friends you know</li>
              <li>• Share the invite link for quick access</li>
              <li>• Only admins can invite new members</li>
              <li>• Members can leave the circle at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
