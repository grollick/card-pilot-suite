import { useNavigate } from "react-router-dom";
import { Crown, DollarSign, ArrowUpRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTopCustomers } from "@/hooks/useCustomerValue";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function TopCustomersWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useTopCustomers(5);

  return (
    <motion.div {...fade} className="dash-card">
      <div className="dash-card-header">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          <Crown className="h-4 w-4 text-warning" />
          Top Customers
        </h2>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/contacts")}>
          View All <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>
      <div className="dash-card-body">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : !data || data.customers.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No customer data yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Complete jobs to see lifetime values</p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 mb-3">
              <span className="text-xs text-muted-foreground">{data.totalCustomers} customers with revenue</span>
              <span className="text-xs font-semibold">${data.totalValue.toLocaleString()} total</span>
            </div>

            <div className="space-y-1">
              {data.customers.map((customer, i) => {
                const initials = customer.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                const needsAttention = customer.daysSinceLastService !== null && customer.daysSinceLastService > 90;
                return (
                  <div
                    key={customer.leadId}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/contacts/${customer.leadId}`)}
                  >
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {initials}
                      </div>
                      {customer.isVip && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning flex items-center justify-center">
                          <Crown className="h-2.5 w-2.5 text-warning-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {customer.name}
                        </p>
                        {customer.isVip && (
                          <Badge variant="outline" className="text-[9px] border-warning/40 text-warning px-1 py-0 h-4">
                            VIP
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {customer.totalJobs} job{customer.totalJobs !== 1 ? "s" : ""}
                        {needsAttention && (
                          <span className="text-warning ml-1">
                            · {customer.daysSinceLastService}d ago
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        ${customer.lifetimeValue.toLocaleString()}
                      </p>
                      {i === 0 && <p className="text-[10px] text-muted-foreground">#1</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
