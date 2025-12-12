// client/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/inventory';

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
  createdAt: string | Date | Timestamp;
  updatedAt: string | Date | Timestamp;
  created_at?: string | Date | Timestamp;
  updated_at?: string | Date | Timestamp;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Função auxiliar para remover campos undefined
  const removeUndefinedFields = (obj: any): any => {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (typeof obj[key] === 'object' && !(obj[key] instanceof Timestamp) && !Array.isArray(obj[key])) {
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
    
    // Criar objeto base sem campos undefined
    const dbProduct: any = {
      name: product.name || '',
      category: product.category || 'bed',
      sku: product.sku || '',
      description: product.description || '',
      basePrice: product.basePrice || 0,
      base_price: product.basePrice || 0,
      costPrice: product.costPrice || 0,
      cost_price: product.costPrice || 0,
      margin: product.margin || 0,
      status: product.status || 'active',
      models: product.models || [],
      specifications: product.specifications || [],
      images: product.images || [],
      createdAt: now,
      updatedAt: now,
      created_at: now,
      updated_at: now,
    };

    // Adicionar barcode apenas se existir
    if (product.barcode && product.barcode.trim() !== '') {
      dbProduct.barcode = product.barcode.trim();
    }

    return dbProduct;
  };

  // Converter DbProduct para Product
  const dbToProduct = (doc: any): Product => {
    const data = doc.data();
    const parseDate = (value: any): Date => {
      if (!value) return new Date();
      if (value instanceof Timestamp) return value.toDate();
      if (value instanceof Date) return value;
      return new Date(value);
    };

    return {
      id: doc.id,
      name: data.name || '',
      category: data.category || 'bed',
      sku: data.sku || '',
      barcode: data.barcode || undefined,
      description: data.description || '',
      basePrice: data.basePrice || data.base_price || 0,
      costPrice: data.costPrice || data.cost_price || 0,
      margin: data.margin || 0,
      status: data.status || 'active',
      models: data.models || [],
      specifications: data.specifications || [],
      images: data.images || [],
      createdAt: parseDate(data.createdAt || data.created_at),
      updatedAt: parseDate(data.updatedAt || data.updated_at),
    };
  };

  // Buscar todos os produtos
  const fetchProducts = async (): Promise<Product[]> => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const productsList = snapshot.docs.map(dbToProduct);
      setProducts(productsList);
      console.log(`✅ ${productsList.length} produtos carregados do Firestore`);
      return productsList;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      setProducts([]);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Criar novo produto
  const createProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      // Validar duplicação de SKU
      if (productData.sku && productData.sku.trim() !== '') {
        const existingProduct = products.find(
          p => p.sku.toLowerCase() === productData.sku.trim().toLowerCase()
        );
        
        if (existingProduct) {
          throw new Error(`Já existe um produto com o SKU "${productData.sku}". Por favor, use um SKU diferente ou edite o produto existente.`);
        }
      }
      
      const productsRef = collection(db, 'products');
      let dbProduct = productToDb(productData);
      
      // Remover campos undefined antes de salvar
      dbProduct = removeUndefinedFields(dbProduct);
      
      console.log('💾 Salvando produto no Firestore:', dbProduct);
      
      const docRef = await addDoc(productsRef, dbProduct);
      
      console.log('✅ Produto salvo com ID:', docRef.id);
      
      const newProduct: Product = {
        id: docRef.id,
        name: productData.name || '',
        category: productData.category || 'bed',
        sku: productData.sku || '',
        barcode: productData.barcode,
        description: productData.description || '',
        basePrice: productData.basePrice || 0,
        costPrice: productData.costPrice || 0,
        margin: productData.margin || 0,
        status: productData.status || 'active',
        models: productData.models || [],
        specifications: productData.specifications || [],
        images: productData.images || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      throw error;
    }
  };

  // Atualizar produto
  const updateProduct = async (
    productId: string, 
    updates: Partial<Product>
  ): Promise<Product> => {
    try {
      const productRef = doc(db, 'products', productId);
      
      let updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      // Remover campos undefined
      updateData = removeUndefinedFields(updateData);
      
      console.log('💾 Atualizando produto:', productId, updateData);
      
      await updateDoc(productRef, updateData);
      
      console.log('✅ Produto atualizado com sucesso');
      
      const updatedProduct = products.find(p => p.id === productId);
      if (updatedProduct) {
        const merged = { ...updatedProduct, ...updates, updatedAt: new Date() };
        setProducts(prev => prev.map(p => p.id === productId ? merged : p));
        return merged;
      }
      
      throw new Error('Produto não encontrado');
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      throw error;
    }
  };

  // Deletar produto
  const deleteProduct = async (productId: string): Promise<void> => {
    try {
      console.log('🗑️ Excluindo produto:', productId);
      
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      
      console.log('✅ Produto excluído do Firestore');
      
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      throw error;
    }
  };

  // Carregar produtos na inicialização
  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};