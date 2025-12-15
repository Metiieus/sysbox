import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  sku: string;
  basePrice?: number;
  base_price?: number;
  models?: any[];
}

interface ProductSearchComboboxProps {
  value?: string;
  onSelect: (productId: string, product: Product) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ProductSearchCombobox({
  value,
  onSelect,
  placeholder = "Buscar produto...",
  disabled = false,
  className,
}: ProductSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Buscar produto selecionado ao montar
  useEffect(() => {
    if (value && !selectedProduct) {
      loadSelectedProduct(value);
    }
  }, [value]);

  const loadSelectedProduct = async (productId: string) => {
    try {
      const productRef = collection(db, "products");
      const q = query(productRef, where("__name__", "==", productId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setSelectedProduct({
          id: doc.id,
          name: data.name || "",
          sku: data.sku || "",
          basePrice: data.basePrice || data.base_price || 0,
          base_price: data.basePrice || data.base_price || 0,
          models: data.models || [],
        });
      }
    } catch (error) {
      console.error("Erro ao carregar produto selecionado:", error);
    }
  };

  // Buscar produtos com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts(searchTerm);
      } else {
        setProducts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchProducts = async (term: string) => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const termLower = term.toLowerCase();

      // Buscar por SKU
      const qSku = query(
        productsRef,
        orderBy("sku"),
        where("sku", ">=", termLower),
        where("sku", "<=", termLower + "\uf8ff"),
        limit(50)
      );

      const snapshot = await getDocs(qSku);
      const results: Product[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          name: data.name || "",
          sku: data.sku || "",
          basePrice: data.basePrice || data.base_price || 0,
          base_price: data.basePrice || data.base_price || 0,
          models: data.models || [],
        });
      });

      // Filtrar também por nome (client-side)
      const filtered = results.filter(
        (p) =>
          p.name.toLowerCase().includes(termLower) ||
          p.sku.toLowerCase().includes(termLower)
      );

      setProducts(filtered);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setOpen(false);
    setSearchTerm("");
    onSelect(product.id, product);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedProduct ? (
            <span className="truncate">
              {selectedProduct.sku} - {selectedProduct.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Digite SKU ou nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && searchTerm && products.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Nenhum produto encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente buscar por SKU ou nome
                  </p>
                </div>
              </CommandEmpty>
            )}
            {!loading && !searchTerm && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Digite para buscar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Busque por SKU ou nome do produto
                </p>
              </div>
            )}
            {!loading && products.length > 0 && (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProduct?.id === product.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                        {product.basePrice && (
                          <span className="text-xs font-medium text-green-600">
                            {formatCurrency(product.basePrice)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm truncate">{product.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
