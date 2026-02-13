// src/pages/GigDetail.tsx
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, DollarSign, Package, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function GigDetail() {
  const { id } = useParams(); // Later fetch real data by ID

  // Mock gig data - replace with API later
  const gig = {
    title: "Professional Logo Design with Unlimited Revisions",
    description: "I will create a unique, modern and professional logo for your brand or business. Unlimited revisions until you're 100% satisfied.",
    category: "Graphic Design",
    seller: {
      username: "creativepro",
      level: "Level 2",
      rating: 4.9,
      reviews: 342,
      avatar: "/avatars/creativepro.jpg",
    },
    deliveryTime: "2 days",
    startingPrice: 45,
    packages: [
      { name: "Basic", price: 45, revisions: 2, delivery: "2 days", features: ["1 Logo Concept", "High Resolution Files", "Source File"] },
      { name: "Standard", price: 85, revisions: 5, delivery: "1 day", features: ["3 Logo Concepts", "High Resolution + Source", "Social Media Kit"], recommended: true },
      { name: "Premium", price: 150, revisions: "Unlimited", delivery: "1 day", features: ["5+ Concepts", "Brand Style Guide", "Full Ownership"] },
    ],
    reviews: [
      { user: "Sarah K.", rating: 5, date: "2 weeks ago", text: "Amazing work! Super fast and exactly what I wanted. Will definitely order again!" },
      { user: "Mike T.", rating: 5, date: "1 month ago", text: "Best logo designer I've worked with. Professional and creative." },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--background))] to-slate-950 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gig Header */}
            <div>
              <Badge variant="outline" className="mb-4 border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]">
                {gig.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
                {gig.title}
              </h1>
              <div className="flex items-center gap-6 text-[hsl(var(--muted-foreground))] mb-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{gig.seller.rating}</span>
                  <span>({gig.seller.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{gig.deliveryTime} delivery</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="text-[hsl(var(--foreground))] leading-relaxed">
                <p>{gig.description}</p>
                <ul className="mt-4 space-y-2 list-disc pl-5">
                  <li>High-resolution files (PNG, JPG, SVG)</li>
                  <li>Unlimited revisions (on Premium)</li>
                  <li>Commercial use rights</li>
                </ul>
              </CardContent>
            </Card>

            {/* Packages */}
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Select a Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {gig.packages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-6 transition-all duration-300 ${
                        pkg.recommended
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-[hsl(var(--shadow-card-hover))]"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"
                      }`}
                    >
                      {pkg.recommended && (
                        <Badge className="mb-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Recommended</Badge>
                      )}
                      <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-[hsl(var(--primary))] mb-4">
                        ${pkg.price}
                      </div>
                      <div className="space-y-3 text-sm mb-6">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{pkg.revisions} Revisions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{pkg.delivery}</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-green-500">✓</span> {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                        Continue (${pkg.price})
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Seller Info */}
          <div className="space-y-6">
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md sticky top-24">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={gig.seller.avatar} />
                    <AvatarFallback className="bg-[hsl(var(--primary))] text-white text-xl">
                      {gig.seller.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{gig.seller.username}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{gig.seller.level}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--muted-foreground))]">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{gig.seller.rating}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">({gig.seller.reviews})</span>
                  </div>
                </div>

                <Separator className="bg-[hsl(var(--border))]" />

                <div className="space-y-4">
                  <Button variant="outline" className="w-full border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]">
                    <MessageSquare className="mr-2 h-4 w-4" /> Contact Seller
                  </Button>
                  <Button className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                    Order Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {gig.reviews.map((review, index) => (
                  <div key={index} className="border-b border-[hsl(var(--border))] pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{review.user[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.user}</p>
                        <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                          ))}
                          <span className="ml-2">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[hsl(var(--foreground))]">{review.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}