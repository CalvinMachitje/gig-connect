// src/pages/Gigs.tsx
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Gigs() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pt-20 pb-16">
      <div className="container mx-auto px-6">
        {/* Search & Filters */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
            Explore Freelance Services
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] mb-8">
            Find the perfect freelancer for your project
          </p>

          <div className="max-w-2xl mx-auto">
            <Input
              placeholder="Search services (e.g. logo design, website development)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-14 text-lg shadow-[hsl(var(--shadow-md))]"
            />
          </div>
        </div>

        {/* Gig Grid - will be dynamic later */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Repeatable Gig Card */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden shadow-[hsl(var(--shadow-card))] hover:shadow-[hsl(var(--shadow-card-hover))] transition-all duration-300 group"
            >
              <div className="h-48 bg-gradient-to-br from-slate-800 to-indigo-950 flex items-center justify-center">
                {/* Gig thumbnail placeholder */}
                <span className="text-6xl opacity-30">🎨</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-[hsl(var(--foreground))] mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))]">
                  Professional Logo Design with Unlimited Revisions
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">john_designer</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-[hsl(var(--primary))]">From $25</span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">2 days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}