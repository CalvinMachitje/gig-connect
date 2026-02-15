// src/pages/Buyer/BuyerProfile.tsx
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreVertical, MessageSquare, Bookmark, Star, CheckCircle, Edit, Upload, X } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string;
  role: "buyer" | "seller";
  bio?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  services?: string[];
};

type Review = {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    full_name: string;
    avatar_url?: string;
  };
};

export default function BuyerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user?.id === profile?.id;

  useEffect(() => {
    if (!id) {
      setError("No profile ID provided");
      setLoading(false);
      return;
    }

    const fetchProfileAndData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch profile by full_name
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, role, bio, avatar_url, phone, created_at, updated_at, is_verified")
          .eq("id", id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) throw new Error("Profile not found");

        // 2. Fetch reviews (with reviewer info)
        const { data: reviewDataRaw, error: reviewsError } = await supabase
          .from("reviews")
          .select(`
            id, rating, comment, created_at,
            reviewer:profiles!reviewer_id (full_name, avatar_url)
          `)
          .eq("reviewed_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (reviewsError) {
          console.warn("Reviews fetch warning:", reviewsError);
        }

        // Fix: reviewer is returned as array → take first item
        const reviewsFixed: Review[] = (reviewDataRaw || []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer: r.reviewer?.[0] || { full_name: "Anonymous", avatar_url: undefined },
        }));

        // 3. Fetch services (gigs)
        const { data: gigs, error: gigsError } = await supabase
          .from("gigs")
          .select("title")
          .eq("seller_id", profileData.id)
          .eq("status", "published");

        if (gigsError) console.warn("Gigs fetch warning:", gigsError);

        // 4. Calculate rating
        const avgRating = reviewsFixed.length
          ? reviewsFixed.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsFixed.length
          : 0;

        setProfile({
          ...profileData,
          rating: avgRating,
          review_count: reviewsFixed.length || 0,
          services: gigs?.map(g => g.title) || [],
        });

        setReviews(reviewsFixed);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
        toast.error("Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndData();
  }, [id]);

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditForm({});
    } else {
      setIsEditing(true);
      setEditForm({
        full_name: profile?.full_name || "",
        bio: profile?.bio || "",
        phone: profile?.phone || "",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploadingAvatar(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success("Avatar updated successfully!");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name?.trim() || profile.full_name,
          bio: editForm.bio?.trim(),
          phone: editForm.phone?.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev!,
        full_name: editForm.full_name?.trim() || prev!.full_name,
        bio: editForm.bio?.trim(),
        phone: editForm.phone?.trim(),
      }));

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast.error("Failed to update profile");
    }
  };

  const handleMessage = () => {
    if (!profile?.id) return;
    navigate(`/chat/new?with=${profile.id}`);
  };

  const handleBook = () => {
    if (!profile?.id) return;
    navigate(`/gigs?with=${profile.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full mb-4" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex gap-4 w-full max-w-xs">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-center">
        <h2 className="text-3xl font-bold text-red-400 mb-4">Profile Not Found</h2>
        <p className="text-slate-300 mb-8 max-w-md">{error || "This profile doesn't exist or is not public."}</p>
        <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-700">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              if (isOwnProfile) {
                navigate("/dashboard");
              } else {
                navigate(-1);
              }
            }}
            className="p-2 -ml-2"
            aria-label={isOwnProfile ? "Go to dashboard" : "Go back"}
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>

          <h1 className="text-xl font-semibold text-white">
            {isOwnProfile ? "My Profile" : `${profile.full_name}'s Profile`}
          </h1>

          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                <Button variant="ghost" size="icon" onClick={handleEditToggle}>
                  {isEditing ? <X className="h-5 w-5 text-white" /> : <Edit className="h-5 w-5 text-white" />}
                </Button>
              </>
            )}
            <button className="p-2 -mr-2">
              <MoreVertical className="h-6 w-6 text-white" />
            </button>
          </div>
        </header>

        {/* Profile Header */}
        <section className="flex flex-col items-center mb-10">
          <div className="relative mb-6 group">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-slate-700 ring-2 ring-blue-500/20">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-slate-800 text-2xl font-bold">
                {profile.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>

            {isOwnProfile && (
              <>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Upload className="h-8 w-8 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
                  </div>
                )}
              </>
            )}

            {profile.is_verified && (
              <div className="absolute -bottom-2 -right-2 bg-green-600 p-1.5 rounded-full border-2 border-slate-900">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="w-full max-w-md space-y-4 mb-6">
              <div>
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  name="full_name"
                  value={editForm.full_name || ""}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  name="bio"
                  value={editForm.bio || ""}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                  placeholder="Tell others about yourself..."
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
                <Button onClick={handleEditToggle} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-white mb-2">{profile.full_name}</h2>
              <p className="text-xl text-slate-300 capitalize mb-4">{profile.role}</p>

              <div className="flex flex-wrap gap-4 justify-center">
                {!isOwnProfile && (
                  <>
                    <Button 
                      onClick={handleMessage}
                      className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg gap-2"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Message
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleBook}
                      className="border-slate-600 hover:bg-slate-800 px-8 py-6 text-lg gap-2"
                    >
                      <Bookmark className="h-5 w-5" />
                      Book Now
                    </Button>
                  </>
                )}

                {isOwnProfile && (
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 px-8 py-6 text-lg gap-2"
                    onClick={handleEditToggle}
                  >
                    <Edit className="h-5 w-5" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </>
          )}
        </section>

        {/* Bio */}
        <Card className="bg-slate-900/70 border-slate-700 mb-8 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">About Me</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio || "This user hasn't added a bio yet."}
            </p>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="bg-slate-900/70 border-slate-700 mb-8 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Services Offered</h2>

            {profile.services && profile.services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profile.services.map((service, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/60 p-4 rounded-lg text-center border border-slate-700 hover:border-blue-600 transition-colors"
                  >
                    <p className="font-medium text-slate-200">{service}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 italic">
                No services listed yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Real Reviews */}
        <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">Client Reviews</h2>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">
                  {profile.rating?.toFixed(1) || "No ratings yet"}
                </span>
                <span className="text-slate-400">({profile.review_count || 0})</span>
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.reviewer.avatar_url} alt={review.reviewer.full_name} />
                          <AvatarFallback>{review.reviewer.full_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{review.reviewer.full_name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-300">{review.comment || "No comment provided."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 italic">
                No reviews yet. Be the first to leave one!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}