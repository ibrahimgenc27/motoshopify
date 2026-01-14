import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OrderNote } from "@shared/schema";
import { Trash2, Edit, Save, X, Plus, Clock, Package, Truck, CheckCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface OrderNotesProps {
    orderId: number;
}

export function OrderNotes({ orderId }: OrderNotesProps) {
    const queryClient = useQueryClient();
    const [newNote, setNewNote] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editNoteContent, setEditNoteContent] = useState("");

    const { data: notes, isLoading } = useQuery<OrderNote[]>({
        queryKey: [`/api/admin/orders/${orderId}/notes`],
    });

    const createMutation = useMutation({
        mutationFn: async (note: string) => {
            const res = await apiRequest("POST", `/api/admin/orders/${orderId}/notes`, { note, noteType: 'status_detail' });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}/notes`] });
            setNewNote("");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, note }: { id: number; note: string }) => {
            const res = await apiRequest("PUT", `/api/admin/orders/notes/${id}`, { note });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}/notes`] });
            setEditingNoteId(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/admin/orders/notes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}/notes`] });
        },
    });

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        createMutation.mutate(newNote);
    };

    const handleUpdateNote = (id: number) => {
        if (!editNoteContent.trim()) return;
        updateMutation.mutate({ id, note: editNoteContent });
    };

    const startEditing = (note: OrderNote) => {
        setEditingNoteId(note.id);
        setEditNoteContent(note.note);
    };

    const getStatusConfig = (status?: string) => {
        switch (status) {
            case 'pending': return { label: 'Beklemede', icon: Clock, className: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
            case 'processing': return { label: 'Hazırlanıyor', icon: Package, className: 'text-blue-600 bg-blue-50 border-blue-200' };
            case 'shipped': return { label: 'Kargoda', icon: Truck, className: 'text-purple-600 bg-purple-50 border-purple-200' };
            case 'outForDelivery': return { label: 'Dağıtımda', icon: Truck, className: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
            case 'delivered': return { label: 'Teslim Edildi', icon: CheckCircle, className: 'text-green-600 bg-green-50 border-green-200' };
            default: return null;
        }
    };

    if (isLoading) return <div className="text-sm text-gray-500">Notlar yükleniyor...</div>;

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Textarea
                    placeholder="Yeni not ekle..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[40px] text-sm resize-none h-10 py-2"
                />
                <Button
                    size="icon"
                    onClick={handleAddNote}
                    disabled={createMutation.isPending || !newNote.trim()}
                    className="h-10 w-10 shrink-0"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {notes && notes.length > 0 ? (
                    notes.map((note) => {
                        const statusConfig = note.orderStatus && !['cancellation', 'return'].includes(note.noteType)
                            ? getStatusConfig(note.orderStatus)
                            : null;
                        const StatusIcon = statusConfig?.icon;

                        return (
                            <div key={note.id} className={`p-3 rounded-md border text-sm ${note.noteType === 'cancellation' ? 'bg-red-50 border-red-200' :
                                note.noteType === 'return' ? 'bg-orange-50 border-orange-200' :
                                    'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                            {format(new Date(note.createdAt), "d MMM yyyy HH:mm", { locale: tr })}
                                        </span>
                                        {note.noteType === 'cancellation' && <Badge variant="destructive" className="text-[10px] h-5 px-1 py-0">İptal Nedeni</Badge>}
                                        {note.noteType === 'return' && <Badge variant="secondary" className="text-[10px] h-5 bg-orange-100 text-orange-800 hover:bg-orange-200 px-1 py-0">İade Nedeni</Badge>}

                                        {statusConfig && StatusIcon && (
                                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 py-0 gap-1 flex items-center font-normal ${statusConfig.className}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {statusConfig.label}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        {editingNoteId === note.id ? (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateNote(note.id)}>
                                                    <Save className="h-3 w-3 text-green-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingNoteId(null)}>
                                                    <X className="h-3 w-3 text-gray-600" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(note)}>
                                                    <Edit className="h-3 w-3 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(note.id)}>
                                                    <Trash2 className="h-3 w-3 text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {editingNoteId === note.id ? (
                                    <Textarea
                                        value={editNoteContent}
                                        onChange={(e) => setEditNoteContent(e.target.value)}
                                        className="text-sm min-h-[60px] bg-white"
                                    />
                                ) : (
                                    <p className="text-gray-800 whitespace-pre-wrap break-words">{note.note}</p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-gray-400 italic text-center py-2">Henüz not eklenmemiş.</p>
                )}
            </div>
        </div>
    );
}
