import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Package,
  User
} from "lucide-react";
import { Order, mockOrders, statusColors, statusLabels } from "@/types/order";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProductionCalendarProps {
  orders: Order[];
  onOrderClick?: (order: Order) => void;
}

export default function ProductionCalendar({ orders, onOrderClick }: ProductionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'schedule'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => 
      isSameDay(order.scheduledDate, date) || 
      isSameDay(order.deliveryDate || new Date(), date)
    );
  };

  const getSelectedDateOrders = () => {
    if (!selectedDate) return [];
    return getOrdersForDate(selectedDate);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const priorityIndicator = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-blue-500",
      low: "bg-gray-500"
    };

    return (
      <div
        className="p-3 border border-border rounded-lg hover:bg-muted/5 transition-all cursor-pointer hover:shadow-sm"
        onClick={() => onOrderClick?.(order)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={cn("w-2 h-2 rounded-full", priorityIndicator[order.priority])} />
            <div>
              <div className="font-medium text-sm">{order.orderNumber}</div>
              <div className="text-xs text-muted-foreground truncate">{order.customerName}</div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0", statusColors[order.status])}
          >
            {statusLabels[order.status]}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-muted-foreground">
              <Package className="h-3 w-3 mr-1" />
              <span>{order.products.length} item(s)</span>
            </div>
            <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {isSameDay(order.scheduledDate, selectedDate || new Date()) && "Produção "}
              {order.deliveryDate && isSameDay(order.deliveryDate, selectedDate || new Date()) && "Entrega "}
              {format(order.deliveryDate || order.scheduledDate, "dd/MM", { locale: ptBR })}
            </span>
          </div>

          {order.assignedOperator && (
            <div className="flex items-center text-xs text-muted-foreground">