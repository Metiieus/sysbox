import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { logActivity } from "@/lib/activityLogger";
import { sanitizeForFirestore } from "@/lib/firestore";

// Tipos para o banco de dados
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "seller" | "operator";
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "individual" | "company";
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  trade_name?: string;
  payment_condition?: string;
  representative?: string;
  default_discount?: number; // Desconto padrão em porcentagem (0-100)
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  sku?: string;
  model?: string;
  base_price?: number;
  basePrice?: number;
  cost_price?: number;
  costPrice?: number;
  margin?: number;
  sizes?: string[];
  colors?: string[];
  fabrics?: string[];
  models?: any[];
  specifications?: any[];
  images?: string[];
  description?: string;
  category?: string;
  status?: string;
  active?: boolean;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  seller_id: string;
  status:
    | "pending"
    | "awaiting_approval"
    | "confirmed"
    | "in_production"
    | "quality_check"
    | "ready"
    | "delivered"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  subtotal?: number; // Valor antes do desconto
  discount_percentage?: number; // Desconto em porcentagem (0-100)
  discount_amount?: number; // Valor do desconto em reais
  financial_discount?: number; // Desconto financeiro em porcentagem
  volume_discount?: number; // Desconto por volume em porcentagem
  shipping_value?: number; // Valor do frete
  shipping_discount?: number; // Desconto no frete
  total_amount: number; // Valor final após desconto
  scheduled_date: string;
  delivery_date?: string;
  completed_date?: string;
  production_progress: number;
  assigned_operator?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_trade_name?: string;
  payment_condition?: string;
  representative?: string;
  seller_name?: string;
  products?: OrderProduct[];
  is_fragmented?: boolean;
  fragments?: OrderFragment[];
  total_quantity?: number;
  production_stages?: {
    stage: string;
    status: "pending" | "in_progress" | "completed";
    started_at?: string;
    completed_at?: string;
    assigned_operator?: string;
  }[];
}

export interface OrderFragment {
  id: string;
  order_id: string;
  product_id: string; // Adicionado para fragmentação por produto
  product_name?: string; // Nome do produto para exibição
  size?: string; // Tamanho do produto
  color?: string; // Cor do produto
  fragment_number: number;
  quantity: number;
  scheduled_date: string;
  status: "pending" | "in_production" | "completed";
  progress: number;
  value: number;
  assigned_operator?: string;
  started_at?: string;
  completed_at?: string;
}

export interface OrderProduct {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  model: string;
  size: string;
  color: string;
  fabric: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specifications?: Record<string, any>;
  created_at: string;
}

export function useFirebase() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const connected = Boolean(db);
    setIsConnected(connected);
    setLoading(false);
    console.log("🔌 [useFirebase] Inicializado:", {
      connected,
      isFirebaseConfigured,
      hasDb: !!db,
    });
  }, [user]);

  const normalizeStatus = (value: any): string => {
    if (!value) return "pending";
    if (typeof value === "string") {
      const v = value.toLowerCase().trim();
      if (["pending", "pendente", "pendent", "aguardando"].includes(v))
        return "pending";
      if (["confirmed", "confirmado", "confirmada"].includes(v))
        return "confirmed";
      if (
        ["in_production", "em_producao", "em produção", "producing"].includes(v)
      )
        return "in_production";
      if (["quality_check", "checagem_qualidade", "quality"].includes(v))
        return "quality_check";
      if (["ready", "pronto", "prontos"].includes(v)) return "ready";
      if (
        [
          "delivered",
          "entregue",
          "concluido",
          "concluído",
          "completed",
          "finalizado",
        ].includes(v)
      )
        return "delivered";
      if (["cancelled", "cancelado", "cancelada"].includes(v))
        return "cancelled";
      return v;
    }
    return String(value);
  };

  const mockUsers: User[] = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "admin@bioboxsys.com",
      name: "Administrator",
      role: "admin",
      permissions: ["all"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const toIsoString = (value: any, fallback: string) => {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value?.toDate === "function") {
      try {
        return value.toDate().toISOString();
      } catch {
        return fallback;
      }
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
  };

  const parseNumber = (value: any, fallback = 0) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const normalizeProductRecord = (raw: any, id: string): DbProduct => {
    const defaultIso = new Date().toISOString();
    const createdIso = toIsoString(
      raw?.createdAt ?? raw?.created_at,
      defaultIso,
    );
    const updatedIso = toIsoString(
      raw?.updatedAt ?? raw?.updated_at,
      createdIso,
    );
    const basePriceValue = parseNumber(raw?.basePrice ?? raw?.base_price);
    const costPriceValue = parseNumber(raw?.costPrice ?? raw?.cost_price);

    return {
      id,
      name: raw?.name || "Produto",
      sku: raw?.sku || raw?.SKU || "",
      model: raw?.model,
      base_price: basePriceValue,
      basePrice: basePriceValue,
      cost_price: costPriceValue,
      costPrice: costPriceValue,
      margin: parseNumber(raw?.margin),
      sizes: Array.isArray(raw?.sizes) ? raw.sizes : undefined,
      colors: Array.isArray(raw?.colors) ? raw.colors : undefined,
      fabrics: Array.isArray(raw?.fabrics) ? raw.fabrics : undefined,
      models: Array.isArray(raw?.models) ? raw.models : [],
      specifications: Array.isArray(raw?.specifications)
        ? raw.specifications
        : [],
      images: Array.isArray(raw?.images) ? raw.images : [],
      description: raw?.description,
      category: raw?.category,
      status: raw?.status,
      active:
        typeof raw?.active === "boolean"
          ? raw.active
          : (raw?.status || "").toLowerCase() !== "inactive",
      barcode: raw?.barcode,
      created_at: createdIso,
      updated_at: updatedIso,
      createdAt: createdIso,
      updatedAt: updatedIso,
    };
  };

  const getUsers = async (): Promise<User[]> => {
    console.log("👥 [getUsers] Buscando usuários...");
    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        console.log("✅ [getUsers] Firestore:", users.length);
        return users;
      } catch (err) {
        console.error("❌ [getUsers] Erro:", err);
      }
    }
    const stored = localStorage.getItem("biobox_users");
    const users = stored ? JSON.parse(stored) : mockUsers;
    console.log("💾 [getUsers] localStorage:", users.length);
    return users;
  };

  const getCustomers = async (): Promise<Customer[]> => {
    console.log("🏢 [getCustomers] Buscando clientes...");
    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const snap = await getDocs(collection(db, "customers"));
        const customers = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            ...data,
            tradeName: data.trade_name || data.tradeName,
            paymentCondition: data.payment_condition || data.paymentCondition,
            zipCode: data.zip_code || data.zipCode,
          };
        });
        console.log("✅ [getCustomers] Firestore:", customers.length);
        return customers;
      } catch (err) {
        console.error("❌ [getCustomers] Erro:", err);
      }
    }
    const stored = localStorage.getItem("biobox_customers");
    const customers = stored ? JSON.parse(stored) : [];
    console.log("💾 [getCustomers] localStorage:", customers.length);
    return customers;
  };

  const getProducts = async (): Promise<DbProduct[]> => {
    console.log("📦 [getProducts] Buscando produtos...");
    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const snap = await getDocs(collection(db, "products"));
        const products = snap.docs.map((d) =>
          normalizeProductRecord(d.data(), d.id),
        );
        console.log("✅ [getProducts] Firestore:", products.length);
        return products;
      } catch (err) {
        console.error("❌ [getProducts] Erro:", err);
      }
    }

    const stored = localStorage.getItem("biobox_products");
    if (!stored) {
      console.log("💾 [getProducts] localStorage vazio");
      return [];
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const products = parsed.map((item: any, index: number) =>
        normalizeProductRecord(item, item?.id ?? `product-${index}`),
      );
      console.log("�� [getProducts] localStorage:", products.length);
      return products;
    } catch {
      return [];
    }
  };

  const getOrders = async (): Promise<Order[]> => {
    console.log("🔄 [getOrders] Iniciando busca de pedidos...");
    console.log("🔌 [getOrders] Conexão Firebase:", {
      isConnected,
      hasDb: !!db,
      hasUser: !!user,
      userRole: user?.role,
    });

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const base = collection(db, "orders");
        const shouldFetchAll = !user || user.role === "admin";

        console.log("👤 [getOrders] Filtro:", {
          shouldFetchAll,
          userId: user?.id,
          userRole: user?.role,
        });

        const q = shouldFetchAll
          ? query(base, orderBy("created_at", "desc"))
          : query(
              base,
              where("seller_id", "==", user.id),
              orderBy("created_at", "desc"),
            );

        console.log("📡 [getOrders] Executando query no Firestore...");
        const snap = await getDocs(q);

        console.log("📦 [getOrders] Resultado Firestore:", {
          vazio: snap.empty,
          total: snap.docs.length,
        });

        if (snap.empty) {
          console.warn(
            "⚠️ [getOrders] Firestore vazio ou desconectado, tentando localStorage...",
          );
          const stored = localStorage.getItem("biobox_orders");
          const parsed = stored ? JSON.parse(stored) : [];
          // Desduplicar pedidos do localStorage
          const uniqueParsed = Array.from(
            new Map(parsed.map((item: any) => [item.id, item])).values(),
          );
          console.log("💾 [getOrders] localStorage:", {
            hasData: !!stored,
            total: uniqueParsed.length,
          });
          return uniqueParsed;
        }

        const orders = snap.docs.map((d) => {
          const data = d.data() as any;
          const created = (data.created_at?.toDate?.() as Date) || new Date();
          const updated = (data.updated_at?.toDate?.() as Date) || created;
          const { id: _ignored, ...dataWithoutId } = data;

          const order = {
            ...dataWithoutId,
            id: d.id,
            status: normalizeStatus(data.status ?? dataWithoutId.status),
            priority: data.priority ?? dataWithoutId.priority ?? "medium",
            created_at: created.toISOString(),
            updated_at: updated.toISOString(),
          } as Order;

          return order;
        });

        // Desduplicar pedidos por ID
        const uniqueOrders = Array.from(
          new Map(orders.map((item) => [item.id, item])).values(),
        );

        console.log("✅ [getOrders] Pedidos processados do Firestore:", {
          total: orders.length,
          exemplo: orders[0]
            ? {
                id: orders[0].id,
                order_number: orders[0].order_number,
                status: orders[0].status,
                total_amount: orders[0].total_amount,
                created_at: orders[0].created_at,
                products: orders[0].products?.length || 0,
              }
            : null,
        });

        // Salvar no localStorage para cache
        try {
          localStorage.setItem("biobox_orders", JSON.stringify(orders));
          console.log("💾 [getOrders] Pedidos salvos no cache");
        } catch (err) {
          console.warn("⚠️ [getOrders] Erro ao salvar cache:", err);
        }

        return uniqueOrders;
      } catch (err) {
        console.error("❌ [getOrders] Erro no Firestore:", err);
        console.error("Stack trace:", err instanceof Error ? err.stack : "N/A");
        console.warn(
          "🔄 [getOrders] Erro de conexão/leitura, Fallback para localStorage...",
        );

        const stored = localStorage.getItem("biobox_orders");
        const parsed = stored ? JSON.parse(stored) : [];
        // Desduplicar pedidos do localStorage (fallback)
        const uniqueParsed = Array.from(
          new Map(parsed.map((item: any) => [item.id, item])).values(),
        );

        console.log("💾 [getOrders] localStorage (fallback):", {
          hasData: !!stored,
          total: uniqueParsed.length,
        });

        return uniqueParsed;
      }
    }

    console.log(
      "💾 [getOrders] Firestore não inicializado, usando localStorage...",
    );
    const stored = localStorage.getItem("biobox_orders");
    const parsed = stored ? JSON.parse(stored) : [];
    // Desduplicar pedidos do localStorage
    const uniqueParsed = Array.from(
      new Map(parsed.map((item: any) => [item.id, item])).values(),
    );

    console.log("💾 [getOrders] localStorage:", {
      hasData: !!stored,
      total: uniqueParsed.length,
      exemplo: uniqueParsed[0] || null,
    });

    return uniqueParsed;
  };

  const createOrder = async (
    orderData: Partial<Order>,
  ): Promise<Order | null> => {
    console.log("➕ [createOrder] Criando pedido:", orderData);

    const orderNumber = `PED-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const dataToSave = {
      order_number: orderNumber,
      customer_id: orderData.customer_id!,
      seller_id: user?.id || "unknown",
      status: orderData.status || "pending",
      priority: orderData.priority || "medium",
      subtotal: orderData.subtotal || 0,
      discount_percentage: orderData.discount_percentage || 0,
      discount_amount: orderData.discount_amount || 0,
      financial_discount: orderData.financial_discount || 0,
      volume_discount: orderData.volume_discount || 0,
      shipping_value: orderData.shipping_value || 0,
      shipping_discount: orderData.shipping_discount || 0,
      total_amount: orderData.total_amount || 0,
      scheduled_date:
        orderData.scheduled_date || new Date().toISOString().slice(0, 10),
      delivery_date: orderData.delivery_date,
      completed_date: orderData.completed_date,
      production_progress: orderData.production_progress ?? 0,
      assigned_operator: orderData.assigned_operator,
      notes: orderData.notes,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email,
      customer_trade_name: orderData.customer_trade_name,
      payment_condition: orderData.payment_condition,
      representative: orderData.representative,
      seller_name: user?.name,
      products: orderData.products || [],
      production_stages: [
        { stage: "cutting_sewing", status: "pending" },
        { stage: "carpentry", status: "pending" },
        { stage: "upholstery", status: "pending" },
        { stage: "assembly", status: "pending" },
        { stage: "packaging", status: "pending" },
        { stage: "delivery", status: "pending" },
      ],
    };

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const ref = await addDoc(
          collection(db, "orders"),
          sanitizeForFirestore({
            ...dataToSave,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          }),
        );
        const saved: Order = {
          ...dataToSave,
          id: ref.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Order;

        console.log("✅ [createOrder] Pedido criado no Firestore:", saved.id);

        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("orders:changed", { detail: { id: saved.id } }),
            );
          }
        } catch {}

        await logActivity({
          userId: user?.id,
          userName: user?.name || "",
          actionType: "create",
          entityType: "order",
          entityId: saved.id,
          entityName: saved.order_number,
          description: `Pedido ${saved.order_number} criado por ${user?.name}`,
          metadata: { seller_id: saved.seller_id },
        });
        return saved;
      } catch (err) {
        console.warn(
          "⚠️ [createOrder] Firestore indisponível, usando localStorage:",
          err,
        );
      }
    }

    // Ler pedidos existentes diretamente do localStorage (sem usar getOrders para evitar race condition)
    console.log("💾 [createOrder] Lendo pedidos do localStorage...");
    const storedOrders = localStorage.getItem("biobox_orders");
    const orders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
    console.log("💾 [createOrder] Pedidos existentes:", orders.length);

    const saved = {
      ...dataToSave,
      id: `order-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Order;

    // Salvar no localStorage
    const updatedOrders = [saved, ...orders];
    localStorage.setItem("biobox_orders", JSON.stringify(updatedOrders));
    console.log(
      "💾 [createOrder] Total de pedidos após salvar:",
      updatedOrders.length,
    );

    console.log("✅ [createOrder] Pedido criado no localStorage:", saved.id);

    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("orders:changed", { detail: { id: saved.id } }),
        );
      }
    } catch {}

    await logActivity({
      userId: user?.id,
      userName: user?.name || "",
      actionType: "create",
      entityType: "order",
      entityId: saved.id,
      entityName: saved.order_number,
      description: `Pedido ${saved.order_number} criado por ${user?.name}`,
      metadata: { seller_id: saved.seller_id },
    });
    return saved;
  };

  const updateOrder = async (
    orderId: string,
    updates: Partial<Order>,
  ): Promise<Order | null> => {
    console.log("✏️ [updateOrder] Atualizando pedido:", { orderId, updates });

    const now = new Date().toISOString();
    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        await updateDoc(
          doc(db, "orders", orderId),
          sanitizeForFirestore({
            ...updates,
            updated_at: serverTimestamp(),
          }) as any,
        );
        const snap = await getDoc(doc(db, "orders", orderId));
        const data = snap.data() as any;
        const created = (data.created_at?.toDate?.() as Date) || new Date();
        const updated = (data.updated_at?.toDate?.() as Date) || new Date();

        console.log("✅ [updateOrder] Pedido atualizado no Firestore");

        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("orders:changed", { detail: { id: orderId } }),
            );
          }
        } catch {}

        return {
          id: snap.id,
          ...data,
          created_at: created.toISOString(),
          updated_at: updated.toISOString(),
        } as Order;
      } catch (err) {
        console.warn(
          "⚠️ [updateOrder] Firestore indisponível, usando localStorage:",
          err,
        );
      }
    }

    // Ler pedidos existentes diretamente do localStorage (sem usar getOrders para evitar race condition)
    console.log("💾 [updateOrder] Lendo pedidos do localStorage...");
    const storedOrders = localStorage.getItem("biobox_orders");
    const orders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
    console.log("💾 [updateOrder] Pedidos existentes:", orders.length);

    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, ...updates, updated_at: now } : o,
    );
    localStorage.setItem("biobox_orders", JSON.stringify(updatedOrders));
    console.log(
      "💾 [updateOrder] Total de pedidos após atualizar:",
      updatedOrders.length,
    );

    console.log("✅ [updateOrder] Pedido atualizado no localStorage");

    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("orders:changed", { detail: { id: orderId } }),
        );
      }
    } catch {}

    return updatedOrders.find((o) => o.id === orderId) || null;
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      console.log("🗑️ [deleteOrder] Deletando pedido:", orderId);

      // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
      if (db) {
        try {
          await deleteDoc(doc(db, "orders", orderId));
          console.log("✅ [deleteOrder] Pedido deletado do Firebase");

          await logActivity({
            userId: user?.id,
            userName: user?.name || "",
            actionType: "delete",
            entityType: "order",
            entityId: orderId,
            entityName: orderId,
            description: `Pedido ${orderId} excluído por ${user?.name}`,
            metadata: {},
          });

          return true;
        } catch (err) {
          console.warn(
            "⚠️ [deleteOrder] Firestore indisponível, usando localStorage:",
            err,
          );
        }
      }

      // Ler pedidos existentes diretamente do localStorage (sem usar getOrders para evitar race condition)
      console.log("💾 [deleteOrder] Lendo pedidos do localStorage...");
      const storedOrders = localStorage.getItem("biobox_orders");
      const orders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
      console.log("💾 [deleteOrder] Pedidos existentes:", orders.length);

      const filtered = orders.filter((o) => o.id !== orderId);
      localStorage.setItem("biobox_orders", JSON.stringify(filtered));
      console.log(
        "💾 [deleteOrder] Total de pedidos após deletar:",
        filtered.length,
      );
      console.log("✅ [deleteOrder] Pedido removido do localStorage");
      return true;
    } catch (error) {
      console.error("❌ [deleteOrder] Erro ao deletar pedido:", error);
      return false;
    }
  };

  const createProduct = async (
    productData: Partial<DbProduct>,
  ): Promise<DbProduct | null> => {
    console.log("➕ [createProduct] Criando produto:", productData);

    const nowIso = new Date().toISOString();
    const basePriceValue = parseNumber(
      productData.basePrice ?? productData.base_price,
    );
    const costPriceValue = parseNumber(
      productData.costPrice ?? productData.cost_price,
    );
    const marginValue = parseNumber(productData.margin);

    const base: DbProduct = {
      id: "",
      name: productData.name || "Produto",
      sku: productData.sku || "",
      model: productData.model,
      base_price: basePriceValue,
      basePrice: basePriceValue,
      cost_price: costPriceValue,
      costPrice: costPriceValue,
      margin: marginValue,
      sizes: Array.isArray(productData.sizes) ? productData.sizes : undefined,
      colors: Array.isArray(productData.colors)
        ? productData.colors
        : undefined,
      fabrics: Array.isArray(productData.fabrics)
        ? productData.fabrics
        : undefined,
      models: Array.isArray(productData.models) ? productData.models : [],
      specifications: Array.isArray(productData.specifications)
        ? productData.specifications
        : [],
      images: Array.isArray(productData.images) ? productData.images : [],
      description: productData.description,
      category: productData.category,
      status: productData.status || "active",
      active:
        typeof productData.active === "boolean"
          ? productData.active
          : (productData.status || "active") !== "inactive",
      barcode: productData.barcode,
      created_at: nowIso,
      updated_at: nowIso,
      createdAt:
        typeof productData.createdAt === "string"
          ? productData.createdAt
          : productData.createdAt instanceof Date
            ? productData.createdAt.toISOString()
            : nowIso,
      updatedAt:
        typeof productData.updatedAt === "string"
          ? productData.updatedAt
          : productData.updatedAt instanceof Date
            ? productData.updatedAt.toISOString()
            : nowIso,
    };

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const ref = await addDoc(
          collection(db, "products"),
          sanitizeForFirestore({
            ...base,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          }),
        );
        console.log("✅ [createProduct] Produto criado no Firestore");
        return normalizeProductRecord(base, ref.id);
      } catch (err) {
        console.error("❌ [createProduct] Erro:", err);
      }
    }

    const products = await getProducts();
    const saved = normalizeProductRecord(base, `product-${Date.now()}`);
    localStorage.setItem(
      "biobox_products",
      JSON.stringify([saved, ...products]),
    );
    console.log("✅ [createProduct] Produto criado no localStorage");
    return saved;
  };

  const updateProduct = async (
    productId: string,
    updates: Partial<DbProduct>,
  ): Promise<DbProduct | null> => {
    console.log("✏️ [updateProduct] Atualizando produto:", {
      productId,
      updates,
    });

    const nowIso = new Date().toISOString();

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        await updateDoc(
          doc(db, "products", productId),
          sanitizeForFirestore({
            ...updates,
            updated_at: serverTimestamp(),
          }) as any,
        );
        const snap = await getDoc(doc(db, "products", productId));
        const data = snap.data();
        if (!data) {
          return null;
        }
        console.log("✅ [updateProduct] Produto atualizado no Firestore");
        return normalizeProductRecord(data, snap.id);
      } catch (err) {
        console.error("❌ [updateProduct] Erro:", err);
      }
    }

    const products = await getProducts();
    const updatedProducts = products.map((p) =>
      p.id === productId
        ? normalizeProductRecord(
            { ...p, ...updates, updated_at: nowIso, updatedAt: nowIso },
            productId,
          )
        : p,
    );
    localStorage.setItem("biobox_products", JSON.stringify(updatedProducts));
    console.log("✅ [updateProduct] Produto atualizado no localStorage");
    return updatedProducts.find((p) => p.id === productId) || null;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    console.log("🗑️ [deleteProduct] Deletando produto:", productId);

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        await deleteDoc(doc(db, "products", productId));
        console.log("✅ [deleteProduct] Produto deletado do Firestore");
        return true;
      } catch (err) {
        console.error("❌ [deleteProduct] Erro:", err);
      }
    }

    const products = await getProducts();
    const filtered = products.filter((p) => p.id !== productId);
    localStorage.setItem("biobox_products", JSON.stringify(filtered));
    console.log("✅ [deleteProduct] Produto deletado do localStorage");
    return true;
  };

  const createCustomer = async (
    customerData: Partial<Customer>,
  ): Promise<Customer | null> => {
    console.log("➕ [createCustomer] Criando cliente:", customerData);

    const base: Customer = {
      id: "",
      name: customerData.name || "Cliente",
      email: customerData.email || "",
      phone: customerData.phone || "",
      cpf: customerData.cpf,
      cnpj: customerData.cnpj,
      tradeName: customerData.tradeName,
      paymentCondition: customerData.paymentCondition,
      representative: customerData.representative,
      type: customerData.type || "individual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      zip_code: customerData.zip_code,
      default_discount: customerData.default_discount,
    } as Customer;

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        const ref = await addDoc(
          collection(db, "customers"),
          sanitizeForFirestore({
            ...base,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          }),
        );
        console.log("✅ [createCustomer] Cliente criado no Firestore");
        return { ...base, id: ref.id } as Customer;
      } catch (err) {
        console.error("❌ [createCustomer] Erro:", err);
      }
    }

    const customers = await getCustomers();
    const saved = { ...base, id: `customer-${Date.now()}` };
    localStorage.setItem(
      "biobox_customers",
      JSON.stringify([saved, ...customers]),
    );
    console.log("✅ [createCustomer] Cliente criado no localStorage");
    return saved;
  };

  const updateCustomer = async (
    customerId: string,
    updates: Partial<Customer>,
  ): Promise<Customer | null> => {
    console.log("✏️ [updateCustomer] Atualizando cliente:", {
      customerId,
      updates,
    });

    const now = new Date().toISOString();

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.cpf !== undefined) updateData.cpf = updates.cpf;
    if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj;
    if (updates.tradeName !== undefined)
      updateData.trade_name = updates.tradeName;
    if (updates.paymentCondition !== undefined)
      updateData.payment_condition = updates.paymentCondition;
    if (updates.representative !== undefined)
      updateData.representative = updates.representative;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.zip_code !== undefined) updateData.zip_code = updates.zip_code;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.default_discount !== undefined)
      updateData.default_discount = updates.default_discount;

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        await updateDoc(
          doc(db, "customers", customerId),
          sanitizeForFirestore({
            ...updateData,
            updated_at: serverTimestamp(),
          }) as any,
        );
        const snap = await getDoc(doc(db, "customers", customerId));
        const data = snap.data() as any;
        const created = (data.created_at?.toDate?.() as Date) || new Date();
        const updated = (data.updated_at?.toDate?.() as Date) || new Date();

        console.log("✅ [updateCustomer] Cliente atualizado no Firestore");

        return {
          id: snap.id,
          ...data,
          tradeName: data.trade_name || data.tradeName,
          paymentCondition: data.payment_condition || data.paymentCondition,
          zipCode: data.zip_code || data.zipCode,
          created_at: created.toISOString(),
          updated_at: updated.toISOString(),
        } as Customer;
      } catch (err) {
        console.error("❌ [updateCustomer] Erro:", err);
      }
    }

    const customers = await getCustomers();
    const updated = customers.map((c) =>
      c.id === customerId ? { ...c, ...updates, updated_at: now } : c,
    );
    localStorage.setItem("biobox_customers", JSON.stringify(updated));

    console.log("��� [updateCustomer] Cliente atualizado no localStorage");

    return updated.find((c) => c.id === customerId) || null;
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    console.log("🗑️ [deleteCustomer] Deletando cliente:", customerId);

    // Sempre tentar ler do Firestore se o objeto DB existe, ignorando o estado isConnected
    if (db) {
      try {
        await deleteDoc(doc(db, "customers", customerId));
        console.log("✅ [deleteCustomer] Cliente deletado do Firestore");
        return true;
      } catch (err) {
        console.error("❌ [deleteCustomer] Erro:", err);
      }
    }

    const customers = await getCustomers();
    const filtered = customers.filter((c) => c.id !== customerId);
    localStorage.setItem("biobox_customers", JSON.stringify(filtered));
    console.log("✅ [deleteCustomer] Cliente deletado do localStorage");
    return true;
  };

  return {
    isConnected,
    loading,
    getUsers,
    getCustomers,
    getProducts,
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    createProduct,
    updateProduct,
    deleteProduct,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    checkConnection: async () => {
      console.log("🔌 [checkConnection] Verificando conexão...");
      console.log("Status:", { isConnected, hasDb: !!db });
    },
  };
}
