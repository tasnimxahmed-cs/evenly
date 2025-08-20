import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  CreditCard, 
  Settings, 
  Calendar,
  DollarSign,
  UserPlus,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";

interface CirclePageProps {
  params: {
    id: string;
  };
}

export default async function CirclePage({ params }: CirclePageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/signin");
  }

  // Fetch circle data
  const circle = await prisma.circle.findFirst({
    where: {
      id: (await params).id,
      members: {
        some: {
          userId,
        },
      },
      isActive: true,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
      transactions: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          splits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 10, // Show only recent transactions
      },
      _count: {
        select: {
          transactions: true,
          members: true,
        },
      },
    },
  });

  if (!circle) {
    notFound();
  }

  // Calculate total spent
  const totalSpent = circle.transactions.reduce((sum, transaction) => {
    return sum + Number(transaction.amount);
  }, 0);

  // Get user's role in this circle
  const userMember = circle.members.find(member => member.user.id === userId);
  const isAdmin = userMember?.role === 'ADMIN';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" asChild className="cursor-pointer">
            <Link href="/dashboard/circles" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Circles
            </Link>
          </Button>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: circle.color || "#6366f1" }}
            >
              {circle.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{circle.name}</h1>
              {circle.description && (
                <p className="text-muted-foreground mb-2">{circle.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {circle._count.members} member{circle._count.members !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  {circle._count.transactions} transaction{circle._count.transactions !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {formatDate(circle.createdAt)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button asChild className="cursor-pointer">
              <Link href={`/dashboard/circles/${circle.id}/transactions`} className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                View Transactions
              </Link>
            </Button>
            <Button asChild className="cursor-pointer">
              <Link href={`/dashboard/circles/${circle.id}/transactions/new`} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" asChild className="cursor-pointer">
                <Link href={`/dashboard/circles/${circle.id}/settings`} className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">{circle._count.members}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{circle._count.transactions}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Members Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Members</h2>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                <Link href={`/dashboard/circles/${circle.id}/members`} className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite
                </Link>
              </Button>
            )}
          </div>
          
          <div className="rounded-lg border bg-card">
            <div className="p-4">
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
                      {member.role}
                    </span>
                    {member.user.id === userId && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href={`/dashboard/circles/${circle.id}/transactions`}>
                View All
              </Link>
            </Button>
          </div>
          
          <div className="rounded-lg border bg-card">
            {circle.transactions.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first transaction to start tracking shared expenses
                </p>
                <Button asChild className="cursor-pointer">
                  <Link href={`/dashboard/circles/${circle.id}/transactions/new`} className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {circle.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {transaction.createdBy.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.createdBy.name} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(transaction.amount))}</p>
                      <p className="text-sm text-muted-foreground">
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
    </div>
  );
}
