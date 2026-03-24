import EstimateDutyPanel from "../components/EstimateDutyPanel";

export default function DutyPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">On Duty</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle your availability to receive job requests and estimates from the marketplace.
        </p>
      </div>
      <EstimateDutyPanel />
    </div>
  );
}
