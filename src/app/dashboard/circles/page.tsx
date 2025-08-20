import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Users, Settings, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function CirclesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/signin");
  }

  // Fetch user's circles
  const circles = await prisma.circle.findMany({
    where: {
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
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Circles</h1>
          <Button asChild className="cursor-pointer">
            <Link href="/dashboard/circles/new" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              New Circle
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your expense circles and invite friends to split bills together.
        </p>
      </div>

      {/* Circles List */}
      <div className="space-y-4">
        {circles.length === 0 ? (
          <div className="rounded-lg border bg-card p-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No circles yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first circle to start splitting expenses with friends, roommates, or travel companions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="cursor-pointer">
                  <Link href="/dashboard/circles/new" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Circle
                  </Link>
                </Button>
                <Button variant="outline" asChild className="cursor-pointer">
                  <Link href="/dashboard/circles/join">
                    Join Existing Circle
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {circles.map((circle) => (
              <div
                key={circle.id}
                className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: circle.color || "#6366f1" }}
                    >
                      {circle.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{circle.name}</h3>
                      {circle.description && (
                        <p className="text-muted-foreground text-sm mb-2">
                          {circle.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {circle.members.length} member{circle.members.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {circle._count.transactions} transaction{circle._count.transactions !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(circle.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="cursor-pointer">
                    <Link href={`/dashboard/circles/${circle.id}`}>
                      View Circle
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Smart Circles</h3>
          <p className="text-muted-foreground">
            Create circles for roommates, trips, or any recurring expense sharing with flexible member management.
          </p>
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Permission Control</h3>
          <p className="text-muted-foreground">
            Set different roles and permissions for circle members to control who can add transactions.
          </p>
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Easy Invites</h3>
          <p className="text-muted-foreground">
            Invite friends via email or share a link. They can join instantly and start contributing.
          </p>
        </div>
      </div>
    </div>
  );
}
