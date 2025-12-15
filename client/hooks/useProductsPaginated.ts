import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/inventory";

export interface DbProduct {
  id?: string;
  name: string;
  category: string;
  sku: string;
  barcode?: string;
  description?: string;
  basePrice: number;
  base_price?: number;
  costPrice: number;
  cost_price?: number;
  margin: number;
  status: string;
  models: Array<{
    id: string;
    name: string;
    priceModifier: number;
    stockQuantity: number;
    minimumStock: number;
    isActive: boolean;
    sizes: any[];
    colors: any[];
    fabrics: any[];
  }>;
  specifications?: any[];
  images?: string[];
  productType?: string;
  size?: string;
  color?: string;
  fabric?: string;
  customer?: string;
  customerPrices?: Record<string, number>;
  createdAt: string | Date | Timestamp;
  updatedAt: string | Date | Timestamp;
  created_at?: string | Date | Timestamp;
  updated_at?: string | Date | Timestamp;
}

const PAGE_SIZE = 50; // Produtos por página

export const useProductsPaginated = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Função auxiliar para remover campos undefined
  const removeUndefinedFields = (obj: any): any => {
    const cleaned: any = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (
          typeof obj[key] === "object" &&
          !(obj[key] instanceof Timestamp) &&
          !Array.isArray(obj[key])
        ) {
          const cleanedNested = removeUndefinedFields(obj[key]);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = obj[key];
        }
      }
    });
    return cleaned;
  };

  // Converter Product para DbProduct
  const productToDb = (product: Partial<Product>) => {
    const now = Timestamp.now();

    const dbProduct: any = {
      name: product.name || "",
      category: product.category || "bed",
      sku: product.sku || "",
      description: product.description || "",
      basePrice: product.basePrice || 0,
      base_price: product.basePrice || 0,
      costPrice: product.costPrice || 0,
      cost_price: product.costPrice || 0,
      margin: product.margin || 0,
      status: product.status || "active",
      models: product.models || [],
      specifications: product.specifications || [],
      images: product.images || [],
      createdAt: now,
      updatedAt: now,
      created_at: now,
      updated_at: now,
    };

    if (product.barcode) {
      dbProduct.barcode = product.barcode;
    }

    if (product.customerPrices) {
      dbProduct.customerPrices = product.customerPrices;
    }

    return removeUndefinedFields(dbProduct);
  };

  // Converter DbProduct para Product
  const dbToProduct = (doc: QueryDocumentSnapshot<DocumentData>): Product => {
    const data = doc.data();
    const parseDate = (value: any): Date => {
      if (!value) return new Date();
      if (value instanceof Timestamp) return value.toDate();
      if (value instanceof Date) return value;
      return new Date(value);
    };

    const product: Product = {
      id: doc.id,
      name: data.name || "",
      category: data.category || "bed",
      sku: data.sku || "",
      barcode: data.barcode || undefined,
      description: data.description || "",
      basePrice: data.basePrice || data.base_price || 0,
      costPrice: data.costPrice || data.cost_price || 0,
      margin: data.margin || 0,
      status: data.status || "active",
      models: data.models || [],
      specifications: data.specifications || [],
      images: data.images || [],
      createdAt: parseDate(data.createdAt || data.created_at),
      updatedAt: parseDate(data.updatedAt || data.updated_at),
    };

    if (data.customerPrices && typeof data.customerPrices === "object") {
      product.customerPrices = data.customerPrices;
    }

    return product;
  };

  // Buscar total de produtos (para paginação)
  const fetchTotalCount = useCallback(async () => {
    try {
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      setTotalCount(snapshot.size);
    } catch (error) {
      console.error("❌ Erro ao buscar total de produtos:", error);
    }
  }, []);

  // Buscar produtos com paginação
  const fetchProducts = useCallback(async (pageNum: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      
      let q;
      
      if (search.trim()) {
        // Busca por SKU ou nome (case-insensitive)
        // Nota: Firestore não suporta busca full-text nativa, então fazemos busca pelo início
        const searchLower = search.toLowerCase();
        q = query(
          productsRef,
          orderBy("sku"),
          where("sku", ">=", searchLower),
          where("sku", "<=", searchLower + "\uf8ff"),
          limit(PAGE_SIZE)
        );
      } else {
        // Paginação normal
        if (pageNum === 1) {
          q = query(
            productsRef,
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE)
          );
        } else if (lastDoc) {
          q = query(
            productsRef,
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
          );
        } else {
          // Se não tem lastDoc mas não é página 1, buscar do início
          q = query(
            productsRef,
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE * pageNum)
          );
        }
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setProducts([]);
        setHasMore(false);
        setLoading(false);
        return [];
      }

      const productsList = snapshot.docs.map(dbToProduct);
      
      // Atualizar último documento para próxima página
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      
      // Verificar se há mais produtos
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      
      setProducts(productsList);
      setCurrentPage(pageNum);
      
      console.log(`✅ ${productsList.length} produtos carregados (página ${pageNum})`);
      return productsList;
    } catch (error) {
      console.error("❌ Erro ao buscar produtos:", error);
      setProducts([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  // Buscar produtos por termo de busca (client-side para melhor UX)
  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) {
      // Se busca vazia, recarregar primeira página
      setSearchTerm("");
      setLastDoc(null);
      return fetchProducts(1, "");
    }

    try {
      setLoading(true);
      setSearchTerm(term);
      
      const productsRef = collection(db, "products");
      const termLower = term.toLowerCase();
      
      // Buscar por SKU
      const qSku = query(
        productsRef,
        orderBy("sku"),
        where("sku", ">=", termLower),
        where("sku", "<=", termLower + "\uf8ff"),
        limit(100)
      );
      
      const snapshotSku = await getDocs(qSku);
      const productsBySku = snapshotSku.docs.map(dbToProduct);
      
      // Filtrar também por nome (client-side)
      const filtered = productsBySku.filter(p => 
        p.name.toLowerCase().includes(termLower) ||
        p.sku.toLowerCase().includes(termLower) ||
        p.description?.toLowerCase().includes(termLower)
      );
      
      setProducts(filtered);
      setHasMore(false); // Desabilitar paginação durante busca
      setCurrentPage(1);
      
      console.log(`🔍 ${filtered.length} produtos encontrados para "${term}"`);
      return filtered;
    } catch (error) {
      console.error("❌ Erro ao buscar produtos:", error);
      setProducts([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Ir para próxima página
  const nextPage = useCallback(() => {
    if (hasMore && !loading) {
      fetchProducts(currentPage + 1, searchTerm);
    }
  }, [hasMore, loading, currentPage, searchTerm, fetchProducts]);

  // Ir para página anterior
  const previousPage = useCallback(() => {
    if (currentPage > 1 && !loading) {
      setLastDoc(null); // Reset para buscar do início
      fetchProducts(currentPage - 1, searchTerm);
    }
  }, [currentPage, loading, searchTerm, fetchProducts]);

  // Ir para primeira página
  const goToFirstPage = useCallback(() => {
    setLastDoc(null);
    fetchProducts(1, searchTerm);
  }, [searchTerm, fetchProducts]);

  // Criar novo produto
  const createProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      const dbProduct = productToDb(productData);
      const productsRef = collection(db, "products");
      const docRef = await addDoc(productsRef, dbProduct);
      
      const newProduct: Product = {
        ...productData,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;
      
      // Recarregar primeira página
      goToFirstPage();
      
      console.log("✅ Produto criado:", docRef.id);
      return newProduct;
    } catch (error) {
      console.error("❌ Erro ao criar produto:", error);
      throw error;
    }
  };

  // Atualizar produto
  const updateProduct = async (
    productId: string,
    updates: Partial<Product>
  ): Promise<Product> => {
    try {
      const productRef = doc(db, "products", productId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        updated_at: Timestamp.now(),
      };
      
      const cleanedData = removeUndefinedFields(updateData);
      await updateDoc(productRef, cleanedData);
      
      // Atualizar produto na lista local
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
      );
      
      console.log("✅ Produto atualizado:", productId);
      return { ...updates, id: productId } as Product;
    } catch (error) {
      console.error("❌ Erro ao atualizar produto:", error);
      throw error;
    }
  };

  // Deletar produto
  const deleteProduct = async (productId: string): Promise<void> => {
    try {
      const productRef = doc(db, "products", productId);
      await deleteDoc(productRef);
      
      // Remover da lista local
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      console.log("✅ Produto deletado:", productId);
    } catch (error) {
      console.error("❌ Erro ao deletar produto:", error);
      throw error;
    }
  };

  // Carregar primeira página ao montar
  useEffect(() => {
    fetchTotalCount();
    fetchProducts(1);
  }, []);

  return {
    products,
    loading,
    hasMore,
    currentPage,
    totalCount,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    pageSize: PAGE_SIZE,
    searchTerm,
    fetchProducts,
    searchProducts,
    nextPage,
    previousPage,
    goToFirstPage,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
