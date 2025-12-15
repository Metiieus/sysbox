import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Users,
  Package,
  Calendar,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Pedidos", href: "/orders", icon: Calendar },
  { name: "Agenda", href: "/agenda", icon: CalendarCheck, requiresPermission: { module: "orders", action: "approve" } },
  { name: "Produção", href: "/production", icon: BarChart3 },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Configurações", href: "/settings", icon: Settings },
];

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const location = useLocation();
  const { user, checkPermission, logout } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;
    
    // Verificar permissão específica se definida
    if ('requiresPermission' in item && item.requiresPermission) {
      const perm = item.requiresPermission as { module: string; action: string };
      return checkPermission(perm.module, perm.action);
    }
    
    const moduleMap: Record<string, string> = {
      "/": "dashboard",
      "/customers": "customers",
      "/orders": "orders",
      "/agenda": "orders",
      "/production": "production",
      "/products": "products",
      "/settings": "settings",
    };
    const module = moduleMap[item.href];
    return module ? checkPermission(module, "view") : false;
  });

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {filteredNavigation.length > 0 && (
        <div
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/40 bg-sidebar/60 backdrop-blur-2xl transition-all duration-300 ease-in-out shadow-lg",
            sidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full lg:translate-x-0",
            sidebarHovered ? "lg:w-64" : "lg:w-20"
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-border/40">
            {sidebarHovered ? (
              <img
                src="/logobio.png"
                alt="BioBox"
                className="h-10 w-auto object-contain transition-all duration-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">B</span>
              </div>
            )}
          </div>

          {/* Navegação */}
          <ScrollArea className="flex-1 py-4 space-y-1">
            <nav className="flex flex-col gap-2 px-3">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl p-3 px-4 w-full transition-all duration-200 hover:bg-primary/10",
                      isActive
                        ? "bg-primary/15 text-primary shadow-sm border border-primary/30"
                        : "text-muted-foreground"
                    )}
                    title={item.name}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110 flex-shrink-0",
                        isActive && "text-primary"
                      )}
                    />
                    {sidebarHovered && (
                      <span className={cn(
                        "text-sm font-medium transition-colors whitespace-nowrap",
                        isActive && "text-primary"
                      )}>
                        {item.name}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer com avatar */}
          <div className="border-t border-border/40 p-3 flex flex-col items-center gap-3">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sair"
              className="hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          filteredNavigation.length > 0 && "lg:ml-20"
        )}
      >
        {/* Botão menu mobile */}
        {filteredNavigation.length > 0 && (
          <div className="lg:hidden fixed top-4 left-4 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="bg-card border border-border"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}

        <main className="min-h-screen px-6 py-8 bg-gradient-to-b from-background to-muted/20 transition-all">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
