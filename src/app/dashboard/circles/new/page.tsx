"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Palette } from "lucide-react";
import Link from "next/link";

const circleColors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Green", value: "#10b981" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
];

export default function NewCirclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/circles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create circle");
      }

      const circle = await response.json();
      router.push(`/dashboard/circles/${circle.id}`);
    } catch (error) {
      console.error("Error creating circle:", error);
      alert(error instanceof Error ? error.message : "Failed to create circle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/circles" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Circles
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Create New Circle</h1>
        <p className="text-muted-foreground">
          Create a new circle to start splitting expenses with friends, roommates, or travel companions.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Circle Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Circle Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Roommates, Trip to Europe, Dinner Club"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description of what this circle is for..."
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Circle Color</label>
          <div className="grid grid-cols-4 gap-3">
            {circleColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${
                  formData.color === color.value
                    ? "border-foreground scale-105"
                    : "border-border hover:border-foreground/50"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                <div className="w-full h-8 rounded bg-white/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="flex-1 cursor-pointer"
          >
            {isLoading ? "Creating..." : "Create Circle"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-8 p-4 rounded-lg border bg-card">
        <h3 className="font-medium mb-2">Tips for creating a great circle:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use a descriptive name that everyone will recognize</li>
          <li>• Add a description to help members understand the purpose</li>
          <li>• Choose a color that helps you identify the circle quickly</li>
          <li>• You can invite friends after creating the circle</li>
        </ul>
      </div>
    </div>
  );
}
