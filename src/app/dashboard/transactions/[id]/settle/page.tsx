import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  User, 
  CheckCircle,
  AlertCircle,
  Zap,
  Users
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";

interface SettlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SettlePage({ params }: SettlePageProps) {
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

  if (isSettled) {
    redirect(`/dashboard/transactions/${transaction.id}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" asChild className="cursor-pointer">
            <Link href={`/dashboard/transactions/${transaction.id}`} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transaction
            </Link>
          </Button>
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settle Transaction</h1>
          <p className="text-muted-foreground">
            Complete payment for &quot;{transaction.name}&quot; in {transaction.circle.name}
          </p>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Transaction Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transaction</p>
                <p className="font-medium">{transaction.name}</p>
              </div>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: transaction.circle.color || "#6366f1" }}
              >
                {transaction.circle.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Your Share</p>
              <p className={`text-xl font-semibold ${userHasPaid ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(userAmount)}
              </p>
              <p className="text-sm text-muted-foreground">
                {userHasPaid ? 'Already paid' : 'Payment pending'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(transaction.date)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transaction.splits.map((split) => (
                <div
                  key={split.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {split.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{split.user.name}</p>
                      <p className="text-xs text-muted-foreground">{split.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(split.amount))}</p>
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

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Options
          </CardTitle>
          <CardDescription>
            Choose how you&apos;d like to settle your share of this transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Coming Soon Message */}
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Integration Coming Soon!</h3>
                         <p className="text-muted-foreground mb-6 max-w-md mx-auto">
               We&apos;re working on integrating secure payment methods to make settling transactions 
               quick and easy. For now, you can mark your share as paid manually.
             </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/transactions/${transaction.id}`}>
                  Back to Transaction
                </Link>
              </Button>
              <Button disabled>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay with Card (Coming Soon)
              </Button>
            </div>
          </div>

          {/* Future Payment Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
            <div className="p-4 border rounded-lg">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">Credit/Debit Card</h4>
              <p className="text-sm text-muted-foreground">Secure payment processing</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">Bank Transfer</h4>
              <p className="text-sm text-muted-foreground">Direct bank-to-bank transfer</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">Digital Wallets</h4>
              <p className="text-sm text-muted-foreground">Apple Pay, Google Pay, etc.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
