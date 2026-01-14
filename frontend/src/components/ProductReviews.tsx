
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Image as ImageIcon, Loader2, Trash2, User, MoreVertical, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ProductReviewsProps {
    productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingReview, setEditingReview] = useState<any>(null);
    const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch reviews
    const { data: reviews, isLoading } = useQuery({
        queryKey: [`/api/products/${productId}/reviews`],
        queryFn: async () => {
            const res = await fetch(`/api/products/${productId}/reviews`);
            if (!res.ok) throw new Error("Yorumlar yüklenemedi");
            return res.json();
        }
    });

    // Upload image mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("image", file);
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Resim yüklenemedi");
            const data = await res.json();
            return data.url;
        }
    });

    // Submit review mutation
    const submitReviewMutation = useMutation({
        mutationFn: async (reviewData: any) => {
            const res = await apiRequest("POST", `/api/products/${productId}/reviews`, reviewData);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
            handleCloseDialog();
            toast({
                title: "Başarılı",
                description: "Yorumunuz başarıyla eklendi.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Hata",
                description: error.message || "Yorum eklenirken bir hata oluştu.",
                variant: "destructive",
            });
        }
    });

    const updateReviewMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            const res = await apiRequest("PUT", `/api/reviews/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
            handleCloseDialog();
            toast({ title: "Başarılı", description: "Yorum güncellendi." });
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: "Güncellenirken hata oluştu.", variant: "destructive" });
        }
    });

    const deleteReviewMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/reviews/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
            toast({ title: "Başarılı", description: "Yorum silindi." });
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: "Silinirken hata oluştu.", variant: "destructive" });
        }
    });

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingReview(null);
        setComment("");
        setRating(5);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast({
                title: "Hata",
                description: "Lütfen bir yorum yazın",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadMutation.mutateAsync(imageFile);
            }

            if (editingReview) {
                await updateReviewMutation.mutateAsync({
                    id: editingReview.id,
                    data: {
                        content: comment,
                        rating,
                        imageUrl: imageUrl || editingReview.imageUrl,
                    }
                });
            } else {
                await submitReviewMutation.mutateAsync({
                    content: comment,
                    rating,
                    imageUrl,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReviewClick = () => {
        if (!user) {
            setIsLoginDialogOpen(true);
            return;
        }
        setIsDialogOpen(true);
    };

    return (
        <div className="py-12 border-t mt-12" id="reviews">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Ürün Değerlendirmeleri ({reviews?.length || 0})</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex text-yellow-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-5 w-5 ${reviews?.length > 0 &&
                                        star <= Math.round(reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length)
                                        ? "fill-current" : "text-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">
                            {reviews?.length > 0
                                ? `${(reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)} ortalama puan`
                                : "Henüz değerlendirme yok"
                            }
                        </span>
                    </div>
                </div>
                <Button onClick={handleAddReviewClick} className="bg-black text-white hover:bg-gray-800">
                    Değerlendirme Yaz
                </Button>
            </div>

            <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center">Giriş Yapın</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                            <User className="h-8 w-8 text-gray-500" />
                        </div>
                        <p className="text-center text-gray-600">
                            Yorum yapmak için lütfen giriş yapın veya kayıt olun. Sadece üyelerimiz değerlendirme yapabilir.
                        </p>
                        <div className="flex w-full gap-3 mt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setIsLoginDialogOpen(false)}>
                                İptal
                            </Button>
                            <Button className="flex-1 bg-black text-white hover:bg-gray-800" onClick={() => setLocation("/login")}>
                                Giriş Yap
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu yorumu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteReviewId && deleteReviewMutation.mutate(deleteReviewId)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingReview ? "Değerlendirmeyi Düzenle" : "Değerlendirme Yaz"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Puanınız</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`h-8 w-8 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Yorumunuz</label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Fotoğraf Ekle (Opsiyonel)</label>
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-dashed"
                                >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    {imageFile ? "Fotoğraf Seçildi" : "Fotoğraf Seç"}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                            {imageFile && (
                                <div className="mt-2 relative inline-block">
                                    <span className="text-xs text-green-600 block mb-1">Seçilen dosya: {imageFile.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-red-500"
                                        onClick={() => {
                                            setImageFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                    >
                                        Kaldır
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full bg-black text-white" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Gönder
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : reviews?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Bu ürün için henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                    </div>
                ) : (
                    reviews?.map((review: any) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <span className="font-semibold">{review.userName}</span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {format(new Date(review.createdAt), "d MMMM yyyy", { locale: tr })}
                                    </span>
                                </div>

                                {user && (user.id === review.userId || user.role === 'admin') && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setEditingReview(review);
                                                setRating(review.rating);
                                                setComment(review.content);
                                                setIsDialogOpen(true);
                                            }}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => {
                                                setDeleteReviewId(review.id);
                                            }}>
                                                <Trash className="mr-2 h-4 w-4" />
                                                Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                            <div className="flex text-yellow-500 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "text-gray-300"}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-700 leading-relaxed mb-3">{review.content}</p>
                            {review.imageUrl && (
                                <div className="mt-3">
                                    <img
                                        src={review.imageUrl}
                                        alt="Review"
                                        className="h-24 w-24 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(review.imageUrl, '_blank')}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
