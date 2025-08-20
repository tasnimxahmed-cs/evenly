'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserMinus, Check, X, Clock, Users } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface FriendRequest {
  id: string;
  user: User;
  createdAt: string;
}

interface FriendsData {
  friends: User[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
}

export default function FriendsPage() {
  const [friendsData, setFriendsData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriendsData(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!newFriendEmail.trim()) return;

    setSendingRequest(true);
    setError('');

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newFriendEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request');
      }

      setNewFriendEmail('');
      fetchFriends(); // Refresh the list
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError(error instanceof Error ? error.message : 'Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error('Failed to update friend request');

      fetchFriends(); // Refresh the list
    } catch (error) {
      console.error('Error updating friend request:', error);
      setError('Failed to update friend request');
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel friend request');

      fetchFriends(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      setError('Failed to cancel friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove friend');

      fetchFriends(); // Refresh the list
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-muted-foreground">Manage your friends and friend requests</p>
        </div>
      </div>

      {/* Add Friend Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Friend
          </CardTitle>
          <CardDescription>
            Send a friend request by entering their email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter friend's email"
              value={newFriendEmail}
              onChange={(e) => setNewFriendEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
              disabled={sendingRequest}
            />
            <Button
              className='cursor-pointer' 
              onClick={sendFriendRequest} 
              disabled={sendingRequest || !newFriendEmail.trim()}
            >
              {sendingRequest ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Friend Requests Received */}
      {friendsData?.receivedRequests && friendsData.receivedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Friend Requests ({friendsData.receivedRequests.length})
            </CardTitle>
            <CardDescription>
              Accept or reject incoming friend requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {friendsData.receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.user.avatar} />
                      <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-sm text-muted-foreground">{request.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(request.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFriendRequest(request.id, 'accept')}
                      className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      className='cursor-pointer'
                      size="sm"
                      variant="outline"
                      onClick={() => handleFriendRequest(request.id, 'reject')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Friend Requests */}
      {friendsData?.sentRequests && friendsData.sentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sent Requests ({friendsData.sentRequests.length})
            </CardTitle>
            <CardDescription>
              Pending friend requests you&apos;ve sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {friendsData.sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.user.avatar} />
                      <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-sm text-muted-foreground">{request.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(request.createdAt))}
                      </p>
                    </div>
                  </div>
                  <Button
                    className='cursor-pointer'
                    size="sm"
                    variant="outline"
                    onClick={() => cancelFriendRequest(request.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Friends ({friendsData?.friends.length || 0})
          </CardTitle>
          <CardDescription>
            People you&apos;re friends with
          </CardDescription>
        </CardHeader>
        <CardContent>
          {friendsData?.friends && friendsData.friends.length > 0 ? (
            <div className="space-y-3">
              {friendsData.friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFriend(friend.id)}
                    className="text-destructive hover:text-destructive cursor-pointer"
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No friends yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Send friend requests to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
