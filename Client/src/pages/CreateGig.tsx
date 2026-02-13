// src/pages/CreateGig.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";

export default function CreateGig() {
  const [gigTitle, setGigTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--background))] to-slate-950 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">Create a New Gig</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-12">
          Fill in the details to offer your service to thousands of buyers
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Gig Details</CardTitle>
                <CardDescription>Be specific and clear to attract the right buyers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Gig Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. I will design a professional logo for your brand"
                    value={gigTitle}
                    onChange={(e) => setGigTitle(e.target.value)}
                    className="bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Max 80 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="graphic-design">Graphic Design</SelectItem>
                      <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                      <SelectItem value="programming">Programming & Tech</SelectItem>
                      <SelectItem value="writing">Writing & Translation</SelectItem>
                      <SelectItem value="video-animation">Video & Animation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your service in detail..."
                    className="min-h-[180px] bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gallery (Images/Video)</Label>
                  <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                    <p className="mt-4 text-[hsl(var(--muted-foreground))]">Drag & drop or click to upload</p>
                    <Button variant="outline" className="mt-4">
                      Select Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Packages */}
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Packages</CardTitle>
                <CardDescription>Offer different tiers to appeal to various buyer budgets</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Basic Package */}
                <div className="border rounded-xl p-6 mb-6 bg-[hsl(var(--card))]/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Basic</h3>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-[hsl(var(--secondary))] border border-r-0 border-[hsl(var(--border))] rounded-l-md">
                          $
                        </span>
                        <Input className="rounded-l-none bg-[hsl(var(--input))]" placeholder="45" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input placeholder="2 days" />
                    </div>
                    <div className="space-y-2">
                      <Label>Revisions</Label>
                      <Input placeholder="2" />
                    </div>
                  </div>
                  <Textarea placeholder="What's included in Basic package..." className="min-h-[100px]" />
                </div>

                {/* Add Standard & Premium similarly */}
                <Button variant="outline" className="w-full py-6 text-lg border-dashed">
                  <Plus className="mr-2 h-5 w-5" /> Add Another Package
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Publish & Tips */}
          <div className="space-y-6">
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md sticky top-24">
              <CardHeader>
                <CardTitle>Ready to Publish?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Gig Status</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Featured Gig</span>
                    <Switch />
                  </div>
                </div>

                <Separator className="bg-[hsl(var(--border))]" />

                <Button className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 py-7 text-lg">
                  Publish Gig
                </Button>

                <p className="text-sm text-center text-[hsl(var(--muted-foreground))]">
                  By publishing, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Tips for Success</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[hsl(var(--muted-foreground))]">
                <p>• Use high-quality images in your gallery</p>
                <p>• Write a clear and detailed description</p>
                <p>• Offer competitive pricing with clear packages</p>
                <p>• Respond quickly to buyer messages</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}