import { useState } from "react";
import { DollarSign, Plus, Trash2, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useExpenses, useCreateExpense, useDeleteExpense, useExpenseSummary, EXPENSE_CATEGORIES } from "@/hooks/useExpenses";
import { format } from "date-fns";

export default function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const summary = useExpenseSummary();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "materials",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
    is_billable: true,
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.description || !form.amount) return;
    createExpense.mutate(
      {
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
        vendor: form.vendor || null,
        date: form.date,
        is_billable: form.is_billable,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ description: "", amount: "", category: "materials", vendor: "", date: new Date().toISOString().split("T")[0], is_billable: true, notes: "" });
        },
      }
    );
  };

  const categoryColor: Record<string, string> = {
    materials: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    labor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    equipment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    fuel: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    subcontractor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    permits: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    tools: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    office: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
    other: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" /> <span className="font-black text-primary">guzzl</span> <span className="font-normal">Expense Tracker</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track costs, maximize profits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Materials for job..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Store name..." /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_billable} onCheckedChange={(v) => setForm({ ...form, is_billable: v })} />
                <Label>Billable to client</Label>
              </div>
              <Button onClick={handleSubmit} disabled={createExpense.isPending} className="w-full">
                {createExpense.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Spent", value: `$${summary.totalSpent.toFixed(2)}`, icon: DollarSign },
          { label: "Billable", value: `$${summary.billable.toFixed(2)}`, icon: TrendingUp },
          { label: "Expenses", value: summary.count.toString(), icon: Receipt },
          { label: "Categories", value: Object.keys(summary.byCategory).length.toString(), icon: Receipt },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold tabular-nums">{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No expenses yet. Add your first expense to start tracking costs.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <p className="text-sm font-medium truncate">{exp.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`text-[10px] ${categoryColor[exp.category] || ""}`}>
                          {EXPENSE_CATEGORIES.find((c) => c.value === exp.category)?.label || exp.category}
                        </Badge>
                        {exp.vendor && <span className="text-xs text-muted-foreground">{exp.vendor}</span>}
                        <span className="text-xs text-muted-foreground">{format(new Date(exp.date), "MMM d")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">${Number(exp.amount).toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteExpense.mutate(exp.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
