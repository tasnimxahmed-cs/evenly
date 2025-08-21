import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Edit, 
  DollarSign, 
  Calendar, 
  User, 
  Users,
  CreditCard,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";

interface TransactionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/signin");
  }

  // Fetch transaction data
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: (await params).id,
      circle: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      circle: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
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
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  // Calculate totals
  const totalAmount = Number(transaction.amount);
  const paidSplits = transaction.splits.filter(split => split.isPaid);
  const unpaidSplits = transaction.splits.filter(split => !split.isPaid);
  const totalPaid = paidSplits.reduce((sum, split) => sum + Number(split.amount), 0);
  const totalUnpaid = unpaidSplits.reduce((sum, split) => sum + Number(split.amount), 0);
  const isSettled = transaction.splits.every(split => split.isPaid);

  // Get user's split info
  const userSplit = transaction.splits.find(split => split.user.id === userId);
  const userAmount = userSplit ? Number(userSplit.amount) : 0;
  const userHasPaid = userSplit?.isPaid || false;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" asChild className="cursor-pointer">
            <Link href="/dashboard/transactions" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transactions
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl"
              style={{ backgroundColor: transaction.circle.color || "#6366f1" }}
            >
              {transaction.circle.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{transaction.name}</h1>
              {transaction.description && (
                <p className="text-sm text-muted-foreground mb-2">{transaction.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {formatDate(transaction.date)}
                </div>
                <div className="flex items-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {transaction.createdBy.name}
                </div>
                <div className="flex items-center">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {transaction.splits.length} split{transaction.splits.length !== 1 ? 's' : ''}
                </div>
                {transaction.category && (
                  <Badge variant="outline">{transaction.category}</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 self-start">
            <Button asChild className="cursor-pointer" size="sm">
              <Link href={`/dashboard/transactions/${transaction.id}/edit`} className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit Transaction</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </Button>
            {!isSettled && (
              <Button variant="outline" asChild className="cursor-pointer" size="sm">
                <Link href={`/dashboard/transactions/${transaction.id}/settle`} className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settle</span>
                  <span className="sm:hidden">Settle</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Paid</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Unpaid</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Your Share</p>
              <p className={`text-lg sm:text-2xl font-bold ${userHasPaid ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(userAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {userHasPaid ? 'Paid' : 'Unpaid'}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Transaction Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Transaction Details</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Circle</p>
                    <p className="font-medium">{transaction.circle.name}</p>
                  </div>
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: transaction.circle.color || "#6366f1" }}
                  >
                    {transaction.circle.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {transaction.createdBy.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{transaction.createdBy.name}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(transaction.date)}</p>
                </div>

                {transaction.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </div>
                )}

                {transaction.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{transaction.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Splits */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Splits</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {transaction.splits.map((split) => (
                  <div
                    key={split.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {split.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{split.user.name}</p>
                        <p className="text-sm text-muted-foreground">{split.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${split.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Number(split.amount))}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {split.isPaid ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {split.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Banner */}
      {isSettled && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">This transaction is fully settled!</p>
          </div>
        </div>
      )}
    </div>
  );
}
