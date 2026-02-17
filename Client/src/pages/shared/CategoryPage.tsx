// src/pages/shared/CategoryPage.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom"; // ← added useNavigate
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Heart,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";
import "react-loading-skeleton/dist/skeleton.css";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // fixed import
import { toast } from "sonner";

const PAGE_SIZE = 5;

type SellerGroup = {
  seller: {
    id: string;
    full_name: string;
    avatar_url?: string;
    rating?: number;
    is_verified?: boolean;
    is_online?: boolean;
  };
  gigs: {
    id: string;
    title: string;
    description: string;
    price: number;
  }[];
  reviewCount: number;
};

export default function CategoryPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate(); // ← added for navigation
  const decodedCategory = decodeURIComponent(slug || "");

  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("ai");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<SellerGroup[]>({
    queryKey: ["category", decodedCategory, page, minRating, maxPrice, search, sort],
    queryFn: async () => {
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select(
          "id,title,description,price,seller_id,profiles(id,full_name,avatar_url,rating,is_verified,is_online)"
        )
        .ilike("category", `%${decodedCategory}%`);

      if (gigsError) {
        console.error("Gigs fetch error:", gigsError);
        throw gigsError;
      }

      if (!gigsData?.length) return [];

      const grouped = gigsData.reduce((acc: Record<string, SellerGroup>, gig: any) => {
        const sellerId = gig.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = {
            seller: {
              id: sellerId,
              full_name: gig.profiles?.full_name || "Unknown",
              avatar_url: gig.profiles?.avatar_url,
              rating: gig.profiles?.rating,
              is_verified: gig.profiles?.is_verified,
              is_online: gig.profiles?.is_online,
            },
            gigs: [],
            reviewCount: 0,
          };
        }
        acc[sellerId].gigs.push({
          id: gig.id,
          title: gig.title,
          description: gig.description,
          price: gig.price,
        });
        return acc;
      }, {});

      const sellerIds = Object.keys(grouped);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("reviewed_id")
        .in("reviewed_id", sellerIds);

      if (reviewsError) {
        console.warn("Reviews count fetch warning:", reviewsError);
      } else {
        reviewsData?.forEach((r) => {
          if (grouped[r.reviewed_id]) {
            grouped[r.reviewed_id].reviewCount++;
          }
        });
      }

      let result = Object.values(grouped);

      if (search.trim()) {
        const term = search.toLowerCase();
        result = result.filter((s) =>
          s.seller.full_name.toLowerCase().includes(term)
        );
      }

      result = result.filter((s) => {
        const rating = s.seller.rating || 0;
        const cheapest = Math.min(...s.gigs.map((g) => g.price));
        return rating >= minRating && (maxPrice ? cheapest <= maxPrice : true);
      });

      if (sort === "ai") {
        result.sort((a, b) => {
          const scoreA =
            (a.seller.rating || 0) * 2 +
            a.reviewCount +
            (a.seller.is_verified ? 2 : 0) +
            (a.seller.is_online ? 1 : 0);

          const scoreB =
            (b.seller.rating || 0) * 2 +
            b.reviewCount +
            (b.seller.is_verified ? 2 : 0) +
            (b.seller.is_online ? 1 : 0);

          return scoreB - scoreA;
        });
      }

      return result;
    },
    enabled: !!decodedCategory,
  });

  const totalPages = Math.ceil((data?.length || 0) / PAGE_SIZE);
  const paginated = data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  // Save/unsave seller
  const toggleSave = async (sellerId: string) => {
    if (!user) {
      toast.error("Please log in to save sellers");
      return;
    }

    const { data: existing } = await supabase
      .from("saved_sellers")
      .select("id")
      .eq("user_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (existing) {
      await supabase.from("saved_sellers").delete().eq("id", existing.id);
      toast.success("Seller removed from saved");
    } else {
      await supabase.from("saved_sellers").insert({
        user_id: user.id,
        seller_id: sellerId,
      });
      toast.success("Seller saved");
    }
  };

  // Fixed: proper function to message seller (navigates to chat)
  const messageSeller = (sellerId: string) => {
    if (!user) {
      toast.error("Please log in to message sellers");
      return;
    }
    navigate(`/chat/${sellerId}`); // direct chat with seller
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 pb-24">
      <div className="max-w-7xl mx-auto flex gap-10">
        {/* Sticky Sidebar */}
        <div className="w-72 hidden lg:block sticky top-10 h-fit bg-slate-900/70 p-6 rounded-xl border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Filters</h3>

          <Input
            placeholder="Search seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 text-white mb-4"
          />

          <Input
            type="number"
            placeholder="Min rating (0-5)"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value) || 0)}
            className="bg-slate-800 text-white mb-4"
          />

          <Input
            type="number"
            placeholder="Max price per hour"
            value={maxPrice ?? ""}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-800 text-white mb-4"
          />

          <Button
            onClick={() => {
              setMinRating(0);
              setMaxPrice(null);
              setSearch("");
              setSort("ai");
              setPage(1);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Reset Filters
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white capitalize">
              {decodedCategory.replace(/_/g, " ")} Services
            </h1>
            <div className="text-slate-400">
              {data ? `${data.length} sellers found` : ""}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={320} className="rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-12">
              <p className="text-xl mb-4">Failed to load sellers</p>
              <p className="text-slate-400 mb-6">{(error as Error).message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium">No sellers found</p>
              <p className="mt-2">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            paginated.map((s) => (
              <motion.div
                key={s.seller.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-slate-900/80 border-slate-700 hover:border-slate-600 transition">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={s.seller.avatar_url} alt={s.seller.full_name} />
                          <AvatarFallback>{s.seller.full_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>

                        <div>
                          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                            {s.seller.full_name}
                            {s.seller.is_verified && (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            )}
                          </h3>

                          <div className="flex items-center gap-2 text-yellow-400 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400" />
                            {s.seller.rating?.toFixed(1) || "New"}
                            <span className="text-slate-400 text-sm">
                              ({s.reviewCount} reviews)
                            </span>
                          </div>

                          {s.seller.is_online && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full mt-2 inline-block">
                              Online now
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => messageSeller(s.seller.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleSave(s.seller.id)}
                        >
                          <Heart className="h-5 w-5 text-pink-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Gigs grid */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {s.gigs.map((gig) => (
                        <Link key={gig.id} to={`/gig/${gig.id}`}>
                          <div className="bg-slate-800 p-4 rounded-lg hover:bg-slate-700 transition h-full flex flex-col">
                            <h4 className="text-white font-medium mb-2 line-clamp-2">
                              {gig.title}
                            </h4>
                            <p className="text-slate-400 text-sm line-clamp-2 flex-1 mb-3">
                              {gig.description}
                            </p>
                            <span className="text-emerald-400 font-semibold">
                              R{gig.price}/hr
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-slate-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}