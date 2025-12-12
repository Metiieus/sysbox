import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, User, ShoppingCart, Users, Box } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  getDocs,
  limit,
} from "firebase/firestore";

interface ActivityItem {
  id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_name?: string;
  description: string;
  created_at: string | Date;
}

const iconMap: Record<string, any> = {
  order: ShoppingCart,
  customer: Users,
  product: Box,
  user: User,
  production: Package,
  default: Package,
};

const actionColors: Record<string, string> = {
  create: "bg-biobox-green/10 text-biobox-green border-biobox-green/20",
  update: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delete: "bg-red-500/10 text-red-500 border-red-500/20",
  complete: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const actionLabels: Record<string, string> = {
  create: "Criado",
  update: "Atualizado",
  delete: "Excluído",
  complete: "Concluído",
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const load = async () => {
      if (isFirebaseConfigured && db) {
        const q = query(
          collection(db, "activities"),
          orderBy("created_at", "desc"),
          limit(20),
        );
        unsub = onSnapshot(q, (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data() as any;
            const created = data.created_at?.toDate?.()
              ? data.created_at.toDate()
              : new Date();
            return { id: d.id, ...data, created_at: created } as ActivityItem;
          });
          setActivities(list);
          setLoading(false);
        });
      } else {
        const stored = JSON.parse(
          localStorage.getItem("biobox_activities") || "[]",
        );
        setActivities(stored);
        setLoading(false);
      }
    };
    load();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const getTimeAgo = (date: string | Date) => {
    try {
      const dt = typeof date === "string" ? new Date(date) : date;
      return formatDistanceToNow(dt, { addSuffix: true, locale: ptBR });
    } catch {
      return "agora";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              Nenhuma atividade registrada ainda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.entity_type] || iconMap.default;
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/5 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-muted/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.entity_name || activity.description}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${actionColors[activity.action_type] || actionColors.create}`}
                      >
                        {actionLabels[activity.action_type] ||
                          activity.action_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {activity.user_name} • {getTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
