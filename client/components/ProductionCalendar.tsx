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
              <User className="h-3 w-3 mr-1" />
              <span>{order.assignedOperator}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-foreground">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Calendário
          </Button>
          <Button
            variant={viewMode === 'schedule' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('schedule')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Agenda
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          {/* Calendar Statistics and Legend */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Estatísticas do Mês</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold text-foreground">{orders.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Urgentes</p>
                        <p className="font-semibold text-red-500">{orders.filter(o => o.priority === 'urgent').length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hoje</p>
                        <p className="font-semibold text-biobox-green">
                          {orders.filter(o => {
                            const today = new Date();
                            return isSameDay(o.scheduledDate, today) || (o.deliveryDate && isSameDay(o.deliveryDate, today));
                          }).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Legenda dos Marcadores</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-biobox-green"></div>
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Urgente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Múltiplos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full ring-2 ring-biobox-green ring-offset-2 ring-offset-background"></div>
                    <span>Hoje</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-4">
            {/* Calendar - Larger area */}
            <div className="xl:col-span-3">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span>📦 {orders.length} pedidos</span>
                        <span>🔥 {orders.filter(o => o.priority === 'urgent').length} urgentes</span>
                        <span>⏱️ {orders.filter(o => o.status === 'in_production').length} produzindo</span>
                        <span>✅ {orders.filter(o => o.status === 'ready').length} prontos</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        Capacidade do Mês
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((orders.length / 30) * 100)}% ocupação
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentDate}
                    onMonthChange={setCurrentDate}
                    locale={ptBR}
                    className="rounded-md border-0 w-full"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      day: "h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground font-bold",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible"
                    }}
                    components={{
                      DayContent: ({ date }) => {
                        const dayOrders = getOrdersForDate(date);
                        const hasOrders = dayOrders.length > 0;
                        const hasUrgent = dayOrders.some(o => o.priority === 'urgent');
                        const hasHigh = dayOrders.some(o => o.priority === 'high');
                        const orderCount = dayOrders.length;
                        const isCurrentDay = isToday(date);

                        let markerColor = "bg-biobox-green";
                        if (hasUrgent) {
                          markerColor = "bg-red-500";
                        } else if (hasHigh) {
                          markerColor = "bg-orange-500";
                        } else if (orderCount > 1) {
                          markerColor = "bg-orange-500";
                        }

                        return (
                          <div className="relative w-full h-full flex flex-col items-center justify-center p-1">
                            <span className={cn(
                              "text-sm mb-1",
                              isCurrentDay && "font-bold",
                              isSameDay(date, selectedDate || new Date()) && "text-primary-foreground"
                            )}>
                              {format(date, "d")}
                            </span>

                            {/* Order indicators */}
                            <div className="flex flex-col items-center space-y-1">
                              {hasOrders && (
                                <div className="flex items-center space-x-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    markerColor,
                                    isCurrentDay && "ring-2 ring-background ring-offset-1 ring-offset-accent"
                                  )} />
                                  {orderCount > 1 && (
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      {orderCount}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Production/Delivery indicators */}
                              {dayOrders.some(o => isSameDay(o.scheduledDate, date)) && (
                                <div className="w-1 h-1 rounded-full bg-blue-500" title="Produção agendada" />
                              )}
                              {dayOrders.some(o => o.deliveryDate && isSameDay(o.deliveryDate, date)) && (
                                <div className="w-1 h-1 rounded-full bg-green-500" title="Entrega agendada" />
                              )}
                            </div>
                          </div>
                        );
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Details - Smaller sidebar */}
            <div className="xl:col-span-1">
              <Card className="bg-card border-border sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {selectedDate
                        ? format(selectedDate, "dd/MM", { locale: ptBR })
                        : "Selecione"
                      }
                    </span>
                  </CardTitle>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "EEEE", { locale: ptBR })}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getSelectedDateOrders().length > 0 ? (
                      getSelectedDateOrders().map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {selectedDate
                            ? "Nenhum pedido para esta data"
                            : "Selecione uma data para ver os pedidos"
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Schedule View */
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Agenda do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {daysInMonth.map(date => {
                const dayOrders = getOrdersForDate(date);
                if (dayOrders.length === 0) return null;

                return (
                  <div key={date.toISOString()} className="border-l-4 border-biobox-green pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {dayOrders.length} pedido(s)
                      </Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {dayOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {orders.filter(order => {
                const orderDate = order.scheduledDate;
                return orderDate >= monthStart && orderDate <= monthEnd;
              }).length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum pedido agendado
                  </h3>
                  <p className="text-muted-foreground">
                    Não há pedidos agendados para este mês
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
