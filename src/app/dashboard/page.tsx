'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { Plus, Users, CreditCard, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { userId, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  interface DashboardData {
    circles: Array<{
      id: string;
      name: string;
      color?: string;
      _count: { transactions: number };
    }>;
    transactions: Array<{
      id: string;
      name: string;
      amount: number;
      date: string;
      circle: { id: string; name: string; color?: string };
      createdBy: { id: string; name: string };
      splits: Array<{
        id: string;
        amount: number;
        user: { id: string; name: string };
      }>;
    }>;
    totalCircles: number;
    totalTransactions: number;
    totalBalance: number;
  }

  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchDashboardData();
    }
  }, [isLoaded, userId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh dashboard data
  const refreshDashboard = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Please sign in to view the dashboard</p>
      </div>
    );
  }

  // Use data from API
  const { circles, transactions, totalCircles, totalTransactions, totalBalance } = data || {
    circles: [],
    transactions: [],
    totalCircles: 0,
    totalTransactions: 0,
    totalBalance: 0,
  };

  return (
    <div>
      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={refreshDashboard}
              variant="outline"
              disabled={loading}
              className="cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild className="cursor-pointer">
              <Link href="/dashboard/circles/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Circle
              </Link>
            </Button>
            <Button variant="outline" asChild className="cursor-pointer">
              <Link href="/dashboard/circles" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                View Circles
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <p className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-green-600' : ''}`}>
                ${Math.abs(totalBalance).toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Circles</p>
              <p className="text-2xl font-bold">{totalCircles}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{totalTransactions}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Circles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Circles</h2>
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href="/dashboard/circles">View All</Link>
            </Button>
          </div>
          {circles.length === 0 ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No circles yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first circle to start splitting expenses with friends
                </p>
                <Button asChild className="cursor-pointer">
                  <Link href="/dashboard/circles/new" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Circle
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {circles.map((circle) => (
                <div
                  key={circle.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: circle.color || "#6366f1" }}
                    >
                      {circle.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium">{circle.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {circle._count.transactions} transaction{circle._count.transactions !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                    <Link href={`/dashboard/circles/${circle.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href="/dashboard/transactions">View All</Link>
            </Button>
          </div>
          <div className="rounded-lg border bg-card p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first transaction to start tracking shared expenses
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: transaction.circle.color || "#6366f1" }}
                      >
                        {transaction.circle.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{transaction.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {transaction.circle.name} • {transaction.createdBy.name}
                        </p>
                      </div>
                    </div>
                                         <div className="text-right">
                       <p className={`font-semibold ${Number(transaction.amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                         ${Math.abs(Number(transaction.amount)).toFixed(2)}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {transaction.splits.length} split{transaction.splits.length !== 1 ? 's' : ''}
                       </p>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
             <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
               <span className="text-primary font-bold text-sm">1</span>
             </div>
             <h3 className="font-medium">Create a Circle</h3>
             <p className="text-sm text-muted-foreground">
               Start by creating a circle for your roommates, trip, or any shared expenses.
             </p>
           </div>
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">2</span>
            </div>
            <h3 className="font-medium">Add Friends</h3>
            <p className="text-sm text-muted-foreground">
              Invite friends to your group so they can contribute to shared expenses.
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">3</span>
            </div>
            <h3 className="font-medium">Track Expenses</h3>
            <p className="text-sm text-muted-foreground">
              Add transactions and let Evenly handle the splitting calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
