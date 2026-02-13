// src/pages/Profile.tsx
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, MessageSquare, Briefcase } from "lucide-react";

export default function Profile() {
  const { username } = useParams(); // e.g. /profile/creativepro

  // Mock profile data
  const profile = {
    username: username || "creativepro",
    fullName: "Creative Pro Design",
    level: "Level 2 Seller",
    rating: 4.9,
    reviews: 342,
    location: "South Africa",
    joined: "January 2024",
    responseTime: "1 hour",
    description: "Professional graphic designer with 5+ years of experience. Specializing in logos, branding, and social media visuals. 100% satisfaction guaranteed.",
    skills: ["Logo Design", "Branding", "Illustration", "UI/UX", "Photoshop", "Illustrator"],
    gigs: [
      { title: "Professional Logo Design", price: 45, rating: 4.9 },
      { title: "Brand Identity Package", price: 120, rating: 5.0 },
      { title: "Social Media Kit Design", price: 60, rating: 4.8 },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--background))] to-slate-950 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-[hsl(var(--primary))]/20">
              <AvatarImage src="/avatars/creativepro.jpg" />
              <AvatarFallback className="bg-[hsl(var(--primary))] text-white text-4xl">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--foreground))]">{profile.fullName}</h1>
                <Badge variant="outline" className="text-lg px-4 py-1 border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]">
                  {profile.level}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-6 text-[hsl(var(--muted-foreground))] mb-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-lg">{profile.rating}</span>
                  <span>({profile.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Response time: {profile.responseTime}</span>
                </div>
              </div>

              <p className="text-lg text-[hsl(var(--foreground))] mb-6">{profile.description}</p>

              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] px-4 py-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gigs Section */}
        <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl">Available Gigs</CardTitle>
            <CardDescription>Browse the services offered by {profile.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.gigs.map((gig, index) => (
                <div
                  key={index}
                  className="border border-[hsl(var(--border))] rounded-xl overflow-hidden bg-[hsl(var(--card))] shadow-[hsl(var(--shadow-card))] hover:shadow-[hsl(var(--shadow-card-hover))] transition-all duration-300"
                >
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-indigo-950" />
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{gig.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span>{gig.rating}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-[hsl(var(--primary))]">From ${gig.price}</span>
                      <Button variant="outline" size="sm">
                        View Gig
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}