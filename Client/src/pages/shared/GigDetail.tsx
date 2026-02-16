// src/pages/shared/GigDetail.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, Star, Loader2, MessageSquare, Calendar } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Gig = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller_id: string;
  seller_name: string;
  rating: number;
  review_count: number;
  image_url?: string;
  created_at: string;
};

const fetchGigDetail = async (id: string) => {
  const { data, error } = await supabase
    .from("gigs")
    .select(`
      id,
      title,
      description,
      price,
      category,
      created_at,
      image_url,
      seller_id,
      profiles!seller_id (
        full_name,
        rating,
        review_count
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Gig not found");

  // profiles can be returned as an array when using a foreign table select; pick the first profile if present
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return {
    ...data,
    seller_name: profile?.full_name || "Unknown",
    rating: profile?.rating || 0,
    review_count: profile?.review_count || 0,
  } as Gig;
};

export default function GigDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNote, setBookingNote] = useState("");

  const { data: gig, isLoading, error, refetch } = useQuery<Gig>({
    queryKey: ["gig", id],
    queryFn: () => fetchGigDetail(id || ""),
    enabled: !!id,
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to book");
      if (!gig) throw new Error("Gig not loaded");

      const { error } = await supabase
        .from("bookings")
        .insert({
          gig_id: gig.id,
          buyer_id: user.id,
          seller_id: gig.seller_id,
          price: gig.price,
          requirements: bookingNote.trim() || null,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking request sent! The seller will review it soon.");
      setShowBookingModal(false);
      setBookingNote("");
      queryClient.invalidateQueries({ queryKey: ["my-bookings", user?.id] });
      navigate("/my-bookings");
    },
    onError: (err: any) => {
      toast.error("Failed to create booking: " + (err.message || "Unknown error"));
    },
  });

  const handleBookNow = () => {
    if (!user) {
      toast.error("Please log in to book this gig");
      return;
    }
    setShowBookingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton height={400} className="rounded-xl" />
          <Skeleton height={80} />
          <Skeleton height={200} />
          <Skeleton height={120} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-400 p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <p className="text-xl mb-4">Failed to load gig</p>
        <p className="text-slate-400 mb-6">{error.message}</p>
        <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
          Retry
        </Button>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <Briefcase className="h-16 w-16 mb-6 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Gig Not Found</h2>
        <p className="mb-8">This gig doesn't exist or has been removed.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to="/gigs">Browse All Gigs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <img
          src={gig.image_url || "/placeholder-gig-large.jpg"}
          alt={gig.title}
          className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
        />

        <h1 className="text-4xl font-bold text-white mb-4">{gig.title}</h1>
        <Badge variant="secondary" className="mb-6 capitalize">
          {gig.category.replace(/_/g, " ")}
        </Badge>

        <p className="text-slate-300 leading-relaxed mb-8 whitespace-pre-line">
          {gig.description}
        </p>

        <div className="flex items-center gap-4 mb-8">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="text-white font-semibold">
            {gig.rating.toFixed(1)}
          </span>
          <span className="text-slate-400">
            ({gig.review_count} reviews)
          </span>
          <span className="text-slate-400 ml-4">• By {gig.seller_name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400 mb-4">
                R{gig.price.toFixed(2)} / hour
              </p>
              <p className="text-slate-400">
                Includes all basic features. Custom packages available upon request.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Seller Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{gig.seller_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{gig.seller_name}</p>
                  <p className="text-sm text-slate-400">
                    Rating: {gig.rating.toFixed(1)} ({gig.review_count} reviews)
                  </p>
                </div>
              </div>
              <Link
                to={`/profile/${gig.seller_id}`}
                className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
              >
                View Full Seller Profile →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-950"
            onClick={() => {
              if (!user) {
                toast.error("Please log in to message the seller");
                return;
              }
              // TODO: navigate to chat creation
              toast.info("Opening chat with seller...");
            }}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Message Seller
          </Button>

          <Button
            onClick={() => {
              if (!user) {
                toast.error("Please log in to book this gig");
                return;
              }
              setShowBookingModal(true);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book Now – R{gig.price.toFixed(2)}/hr
          </Button>
        </div>

        {/* Booking Confirmation Modal */}
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>
                You're about to book <strong>{gig.title}</strong> with{" "}
                <strong>{gig.seller_name}</strong> at R{gig.price.toFixed(2)} per hour.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="requirements">Additional requirements or message</Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g., project deadline, specific tools needed, hours per week, etc..."
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  className="min-h-32 resize-none"
                />
              </div>

              <div className="text-sm text-slate-400">
                This is a booking request. The seller will review and accept or decline.
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createBooking.mutate()}
                disabled={createBooking.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}