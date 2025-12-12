import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Order } from "@/types/order";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface QuickCalendarProps {
  orders: Order[];
  onDateClick?: (date: Date) => void;
  className?: string;
}

export default function QuickCalendar({ orders, onDateClick, className }: QuickCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => 
      isSameDay(order.scheduledDate, date) || 
      (order.deliveryDate && isSameDay(order.deliveryDate, date))
    );
  };

  const getDayStyle = (date: Date) => {
    const dayOrders = getOrdersForDate(date);
    const hasOrders = dayOrders.length > 0;
    const hasUrgent = dayOrders.some(o => o.priority === 'urgent');
    const isCurrentMonth = date >= monthStart && date <= monthEnd;
    const isCurrentDay = isToday(date);

    let bgClass = "hover:bg-accent";
    if (isCurrentDay) {
      bgClass = "bg-primary text-primary-foreground hover:bg-primary/90";
    } else if (hasOrders && isCurrentMonth) {
      if (hasUrgent) {
        bgClass = "bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30";
      } else {
        bgClass = "bg-biobox-green/10 hover:bg-biobox-green/20 text-biobox-green dark:bg-biobox-green/20 dark:hover:bg-biobox-green/30";
      }
    }

    return cn(
      "h-8 w-8 text-xs font-medium rounded-md flex items-center justify-center cursor-pointer transition-colors relative",
      bgClass,
      !isCurrentMonth && "text-muted-foreground opacity-50"
    );
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const today = new Date();
  const todayOrders = getOrdersForDate(today);

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Visão Rápida</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
              <div key={index} className="h-6 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dayOrders = getOrdersForDate(date);
              return (
                <div
                  key={date.toISOString()}
                  className={getDayStyle(date)}
                  onClick={() => onDateClick?.(date)}
                >
                  <span>{format(date, "d")}</span>
                  {dayOrders.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2">
                      <div className="w-full h-full rounded-full bg-current opacity-60" />
                      {dayOrders.length > 1 && (
                        <span className="absolute -top-1 -right-1 text-xs font-bold">
                          {dayOrders.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's summary */}
        {todayOrders.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Hoje</span>
              <Badge variant="outline" className="text-xs">
                {todayOrders.length} pedido(s)
              </Badge>
            </div>
            <div className="space-y-1">
              {todayOrders.slice(0, 2).map(order => (
                <div key={order.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{order.orderNumber}</span>
                  <span className="text-muted-foreground ml-2">
                    {isSameDay(order.scheduledDate, today) ? "Prod." : "Entr."}
                  </span>
                </div>
              ))}
              {todayOrders.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{todayOrders.length - 2} mais...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
