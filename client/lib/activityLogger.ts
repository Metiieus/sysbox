import { db, isFirebaseConfigured } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { sanitizeForFirestore } from "@/lib/firestore";

interface LogActivityParams {
  userId?: string;
  userName: string;
  actionType: "create" | "update" | "delete" | "complete";
  entityType: "order" | "customer" | "product" | "user" | "production";
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    if (isFirebaseConfigured && db) {
      const payload: any = sanitizeForFirestore({
        user_id: params.userId,
        user_name: params.userName,
        action_type: params.actionType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        description: params.description,
        metadata: params.metadata || {},
        created_at: serverTimestamp(),
      });

      await addDoc(collection(db, "activities"), payload);
      return;
    }

    const stored = JSON.parse(
      localStorage.getItem("biobox_activities") || "[]",
    );
    stored.unshift({
      id: `act-${Date.now()}`,
      user_id: params.userId,
      user_name: params.userName,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      description: params.description,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(
      "biobox_activities",
      JSON.stringify(stored.slice(0, 50)),
    );
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
  }
}
