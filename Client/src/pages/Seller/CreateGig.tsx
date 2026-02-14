// src/pages/Seller/CreateGig.tsx
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";

// ── Schema ────────────────────────────────────────────────
const packageSchema = z.object({
  tier: z.enum(["Basic", "Standard", "Premium"]),
  price: z.number().min(5, "Price must be at least $5").max(9999),
  delivery_days: z.number().int().min(1, "At least 1 day").max(90),
  revisions: z.number().int().min(0, "Revisions cannot be negative").max(100),
  description: z.string().min(20, "Too short").max(800),
});

const gigSchema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters").max(80),
  category: z.enum([
    "graphic_design",
    "digital_marketing",
    "programming_tech",
    "writing_translation",
    "video_animation",
    "music_audio",
    "business",
    "lifestyle",
    "other",
  ]),
  description: z.string().min(120, "Description must be at least 120 characters").max(5000),
  // price field kept for backward compatibility / fallback — but packages are primary now
  price: z.number().min(5, "Price must be at least $5").max(9999).optional(),
  gallery_urls: z.array(z.string().url()).max(5, "Maximum 5 images allowed").optional(),
  packages: z
    .array(packageSchema)
    .min(1, "At least one package is required")
    .max(3, "Maximum 3 packages allowed"),
});

type GigForm = z.infer<typeof gigSchema>;
type PackageForm = z.infer<typeof packageSchema>;

// ── Component ─────────────────────────────────────────────
export default function CreateGig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<GigForm>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      title: "",
      category: "graphic_design",
      description: "",
      price: 50,
      gallery_urls: [],
      packages: [
        {
          tier: "Basic",
          price: 50,
          delivery_days: 5,
          revisions: 2,
          description: "",
        },
      ],
    },
    mode: "onChange",
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = form;

  const galleryUrls = watch("gallery_urls") || [];
  const packages = watch("packages") || [];

  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "packages",
  });

  const createGig = useMutation({
    mutationFn: async (data: GigForm) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("gigs")
        .insert({
          seller_id: user.id,
          title: data.title,
          description: data.description,
          price: data.price,              // fallback / original price
          category: data.category,
          gallery_urls: data.gallery_urls,
          packages: data.packages,        // ← added: full packages array
          // status: "draft",             // ← you can add later
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gigs"] });
      toast.success("Gig created successfully!");
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create gig");
    },
  });

  const onSubmit = (data: GigForm) => {
    createGig.mutate(data);
  };

  const titleLength = watch("title")?.length || 0;
  const descLength = watch("description")?.length || 0;

  // ── Gallery: Drag & Drop + Progress ───────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;

    const newFiles = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );

    if (galleryUrls.length + newFiles.length > 5) {
      toast.error(`Maximum 5 images allowed (currently ${galleryUrls.length})`);
      return;
    }

    const tempIds = newFiles.map((f) => `${f.name}-${Date.now()}`);
    setUploadingFiles((prev) => [...prev, ...tempIds]);

    const newUrls: string[] = [];
    const newPreviewsList: string[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const tempId = tempIds[i];

      try {
        // Local preview
        const preview = URL.createObjectURL(file);
        newPreviewsList.push(preview);

        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gig-gallery")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("gig-gallery")
          .getPublicUrl(filePath);

        if (urlData.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }

        setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));
      } catch (err: any) {
        toast.error(`Upload failed for ${file.name}`);
        setUploadProgress((prev) => ({ ...prev, [tempId]: -1 }));
      }
    }

    setValue("gallery_urls", [...galleryUrls, ...newUrls], { shouldValidate: true });
    setPreviews((prev) => [...prev, ...newPreviewsList]);
    setUploadingFiles((prev) => prev.filter((id) => !tempIds.includes(id)));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeImage = (index: number) => {
    const updated = galleryUrls.filter((_, i) => i !== index);
    setValue("gallery_urls", updated);

    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Create a New Gig</h1>
        <p className="text-slate-400 mb-10">Share what you're great at — let's get started.</p>

        <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Gig Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* ── Your original fields (unchanged) ── */}
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">
                  Gig Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. I will build you a modern responsive website"
                  {...register("title")}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  {errors.title ? (
                    <p className="text-red-400">{errors.title.message}</p>
                  ) : (
                    <span>{titleLength}/80</span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-200">
                  Category <span className="text-red-400">*</span>
                </Label>
                <Select
                  onValueChange={(val) => form.setValue("category", val as any)}
                  defaultValue="graphic_design"
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graphic_design">Graphic Design</SelectItem>
                    <SelectItem value="digital_marketing">Digital Marketing</SelectItem>
                    <SelectItem value="programming_tech">Programming & Tech</SelectItem>
                    <SelectItem value="writing_translation">Writing & Translation</SelectItem>
                    <SelectItem value="video_animation">Video & Animation</SelectItem>
                    <SelectItem value="music_audio">Music & Audio</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-400 text-sm">{errors.category.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you'll deliver, your process, experience..."
                  {...register("description")}
                  className="min-h-[180px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  {errors.description ? (
                    <p className="text-red-400">{errors.description.message}</p>
                  ) : (
                    <span>{descLength}/5000</span>
                  )}
                </div>
              </div>

              {/* Original single price (kept as fallback) */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-200">
                  Fallback Price (USD) <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <Input
                    id="price"
                    type="number"
                    min="5"
                    {...register("price", { valueAsNumber: true })}
                    className="pl-8 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                {errors.price && (
                  <p className="text-red-400 text-sm">{errors.price.message}</p>
                )}
              </div>

              {/* ── New: Pricing Packages ──────────────────────────────────────── */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200 text-lg">Pricing Packages *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={packages.length >= 3}
                    onClick={() =>
                      append({
                        tier: packages.length === 0 ? "Basic" : packages.length === 1 ? "Standard" : "Premium",
                        price: packages.length === 0 ? 50 : packages.length === 1 ? 120 : 250,
                        delivery_days: 5,
                        revisions: 3,
                        description: "",
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Package
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-white">
                          {watch(`packages.${index}.tier`)} Package
                        </h3>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Price (USD)</Label>
                          <Input
                            type="number"
                            {...register(`packages.${index}.price`, { valueAsNumber: true })}
                            className="bg-slate-900 border-slate-600"
                          />
                          {errors.packages?.[index]?.price && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.packages[index]?.price?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Delivery (days)</Label>
                          <Input
                            type="number"
                            {...register(`packages.${index}.delivery_days`, { valueAsNumber: true })}
                            className="bg-slate-900 border-slate-600"
                          />
                          {errors.packages?.[index]?.delivery_days && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.packages[index]?.delivery_days?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Revisions</Label>
                          <Input
                            type="number"
                            {...register(`packages.${index}.revisions`, { valueAsNumber: true })}
                            className="bg-slate-900 border-slate-600"
                          />
                          {errors.packages?.[index]?.revisions && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.packages[index]?.revisions?.message}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            {...register(`packages.${index}.description`)}
                            className="min-h-[80px] bg-slate-900 border-slate-600"
                            placeholder="What is included in this package..."
                          />
                          {errors.packages?.[index]?.description && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.packages[index]?.description?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {errors.packages && typeof errors.packages.message === "string" && (
                  <p className="text-red-400 text-sm">{errors.packages.message}</p>
                )}
              </div>

              {/* ── Gallery: Drag & Drop + Per-file Progress ────────────────────── */}
              <div className="space-y-4">
                <Label className="text-slate-200">Gallery Images (up to 5, max 5MB each)</Label>

                {/* Previews */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previews.map((src, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden border border-slate-600">
                        <img src={src} alt={`preview-${index}`} className="w-full h-32 object-cover" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drag & Drop Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={(e) => e.preventDefault()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    uploadingFiles.length > 0
                      ? "border-blue-500 bg-blue-950/30"
                      : "border-slate-600 hover:border-slate-400"
                  }`}
                >
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    id="gallery-upload"
                  />
                  <Label htmlFor="gallery-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                    <p className="text-slate-300">
                      Drag & drop images here or <span className="underline">click to browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">PNG, JPG — max 5MB per image</p>
                  </Label>
                </div>

                {/* Per-file Progress */}
                {uploadingFiles.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {uploadingFiles.map((id) => (
                      <div key={id} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Uploading {id.split("-")[0]}...</span>
                          <span>{uploadProgress[id] ?? 0}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress[id] ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.gallery_urls && (
                  <p className="text-red-400 text-sm">{errors.gallery_urls.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={createGig.isPending || uploadingFiles.length > 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-lg font-medium"
              >
                {createGig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Gig...
                  </>
                ) : uploadingFiles.length > 0 ? (
                  "Uploading images..."
                ) : (
                  "Publish Gig"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}