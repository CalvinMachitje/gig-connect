// src/pages/Seller/SellerProfile.tsx
import { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical, MessageSquare, Bookmark, Star, CheckCircle, Mail, Calendar, Plane, Edit, Phone } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string;
  phone?: string;
  role: "buyer" | "seller";
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  email?: string;
};

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (!id) {
      setError("No profile ID provided");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email, role, avatar_url, bio, created_at, updated_at")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Profile not found");

        setProfile(data);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
        toast.error("Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex flex-col items-center px-4 py-6">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-8 w-48 mt-4" />
          <Skeleton className="h-5 w-32 mt-2" />
          <div className="flex gap-3 mt-6 w-full max-w-xs">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The requested profile could not be loaded."}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <button
          onClick={() => (isOwnProfile ? navigate("/dashboard") : navigate(-1))}
          className="p-2 -ml-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground">
          {isOwnProfile ? "My Profile" : "Worker Profile"}
        </h1>
        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Edit className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <button className="p-2 -mr-2">
            <MoreVertical className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </header>

      {/* Profile Section */}
      <section className="flex flex-col items-center px-4 py-6">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-card">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback>{profile.full_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          {profile.role === "seller" && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
              <CheckCircle className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-4">
          {profile.full_name}
        </h2>
        <p className="text-muted-foreground capitalize">{profile.role}</p>

        <div className="flex gap-3 mt-6 w-full max-w-xs">
          {!isOwnProfile && (
            <>
              <Button className="flex-1 gap-2" variant="default">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
              <Button className="flex-1 gap-2" variant="secondary">
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
            </>
          )}
          {isOwnProfile && (
            <Button className="flex-1 gap-2" asChild>
              <Link to="/settings">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="px-4 py-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">About Me</h3>
        <p className="text-muted-foreground leading-relaxed">
          {profile.bio || "No bio added yet. This user hasn't written an introduction."}
        </p>
      </section>

      {/* Contact Info (visible to others or self) */}
      <section className="px-4 py-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">Contact Info</h3>
        <div className="space-y-3 bg-card rounded-xl p-4 border border-border">
          {profile.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground break-all">{profile.email}</span>
          </div>
        </div>
      </section>

      {/* Placeholder for Services & Reviews – add real tables later */}
      <section className="px-4 py-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">Services Offered</h3>
        <p className="text-muted-foreground italic">Services will appear here once added to the database.</p>
      </section>

      <section className="px-4 py-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">Client Reviews</h3>
        <p className="text-muted-foreground italic">Reviews will appear here once the reviews table is populated.</p>
      </section>

      {/* Fixed Bottom CTA – only show when viewing others */}
      {!isOwnProfile && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div>
              <p className="text-xs text-muted-foreground">Starting at</p>
              <p className="text-2xl font-bold text-foreground">R250<span className="text-sm font-normal text-muted-foreground">/hr</span></p>
            </div>
            <Button size="lg" className="px-8">
              Book Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}