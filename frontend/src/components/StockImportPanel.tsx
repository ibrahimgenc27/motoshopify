/**
 * StockImportPanel - Excel ile toplu stok güncelleme bileşeni
 */

import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Download,
    Upload,
    Loader2,
    CheckCircle,
    XCircle,
    FileSpreadsheet,
    AlertTriangle
} from "lucide-react";

interface StockUpdateResult {
    name: string;
    oldStock: number;
    newStock: number;
}

interface StockError {
    row: number;
    name: string;
    error: string;
}

interface ImportResult {
    success: boolean;
    message: string;
    updated: StockUpdateResult[];
    errors: StockError[];
}

export function StockImportPanel() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch("/api/admin/stock-template", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Şablon indirilemedi");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "stok-sablonu.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: "Başarılı", description: "Şablon indirildi!" });
        } catch (err) {
            toast({ title: "Hata", description: "Şablon indirilemedi", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/admin/stock-import", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Import başarısız");
            }

            setResult(data);

            if (data.success) {
                toast({ title: "Başarılı", description: data.message });
            } else {
                toast({ title: "Kısmi Başarı", description: data.message, variant: "default" });
            }
        } catch (err: any) {
            toast({
                title: "Hata",
                description: err.message || "Stok import işlemi başarısız",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Excel ile Stok Güncelleme
                </CardTitle>
                <CardDescription>
                    Toplu stok güncellemesi için Excel şablonunu indirin, düzenleyin ve yükleyin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={handleDownloadTemplate}
                        disabled={isDownloading}
                        variant="outline"
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Şablon İndir
                    </Button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".xlsx,.xls"
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        Excel Yükle
                    </Button>
                </div>

                {/* Instructions */}
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
                    <p><strong>Nasıl Kullanılır:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>"Şablon İndir" ile mevcut ürün listesini alın</li>
                        <li>"Yeni Stok" sütununa güncel stok değerlerini yazın</li>
                        <li>Dosyayı kaydedin ve "Excel Yükle" ile yükleyin</li>
                    </ol>
                    <p className="text-xs text-orange-600 mt-2">
                        ⚠️ Ürün adları Excel'deki ile birebir eşleşmelidir!
                    </p>
                </div>

                {/* Results */}
                {result && (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="flex items-center gap-2">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                )}
                                <span className="font-medium">{result.message}</span>
                            </div>
                        </div>

                        {/* Updated Products */}
                        {result.updated.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-green-50 px-3 py-2 font-medium text-green-800 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Güncellenen Ürünler ({result.updated.length})
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="text-left px-3 py-2">Ürün</th>
                                                <th className="text-center px-3 py-2">Eski</th>
                                                <th className="text-center px-3 py-2">Yeni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.updated.map((item, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="px-3 py-2 truncate max-w-[200px]">{item.name}</td>
                                                    <td className="text-center px-3 py-2 text-gray-500">{item.oldStock}</td>
                                                    <td className="text-center px-3 py-2 font-medium text-green-600">{item.newStock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {result.errors.length > 0 && (
                            <div className="border border-red-200 rounded-lg overflow-hidden">
                                <div className="bg-red-50 px-3 py-2 font-medium text-red-800 text-sm flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    Hatalar ({result.errors.length})
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="text-center px-2 py-2 w-12">Satır</th>
                                                <th className="text-left px-3 py-2">Ürün</th>
                                                <th className="text-left px-3 py-2">Hata</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errors.map((error, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="text-center px-2 py-2">
                                                        <Badge variant="outline" className="text-xs">{error.row}</Badge>
                                                    </td>
                                                    <td className="px-3 py-2 truncate max-w-[150px] text-gray-700">{error.name}</td>
                                                    <td className="px-3 py-2 text-red-600">{error.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
