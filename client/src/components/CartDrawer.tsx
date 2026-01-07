import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { data: cartItems, isLoading } = useCart();
  const removeMutation = useRemoveFromCart();
  const updateMutation = useUpdateCartQuantity();

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">SEPETİNİZ</SheetTitle>
            {/* Close button is automatically added by SheetContent, but we can customize if needed */}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">Yükleniyor...</div>
          ) : !cartItems || cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <ShoppingBagEmpty className="h-16 w-16 text-muted-foreground opacity-20" />
              <p className="text-lg font-medium text-muted-foreground">Sepetiniz boş</p>
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Alışverişe Başla
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-sm border bg-secondary/20">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="grid gap-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-sm leading-none">{item.product.name}</h3>
                        <p className="text-sm font-semibold">{item.product.price.toLocaleString('tr-TR')} TL</p>
                      </div>
                      {item.selectedColor && (
                        <p className="text-xs text-muted-foreground">Renk: {item.selectedColor}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-sm h-8">
                        <button 
                          className="px-2 h-full hover:bg-muted flex items-center justify-center disabled:opacity-50"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
                            } else {
                              removeMutation.mutate(item.id);
                            }
                          }}
                          disabled={updateMutation.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs tabular-nums">{item.quantity}</span>
                        <button 
                          className="px-2 h-full hover:bg-muted flex items-center justify-center disabled:opacity-50"
                          onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          disabled={updateMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeMutation.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems && cartItems.length > 0 && (
          <div className="border-t p-6 space-y-4 bg-background">
            <div className="flex justify-between text-base font-medium">
              <span>Ara Toplam</span>
              <span>{subtotal.toLocaleString('tr-TR')} TL</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vergiler ve kargo ödeme adımında hesaplanır.
            </p>
            <div className="grid gap-3">
              <Button className="w-full rounded-none h-12 text-base font-bold bg-black hover:bg-black/90 text-white">
                ÖDEMEYE GEÇ
              </Button>
              <Button 
                variant="outline" 
                className="w-full rounded-none h-12"
                onClick={() => onOpenChange(false)}
              >
                ALIŞVERİŞE DEVAM ET
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ShoppingBagEmpty(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
