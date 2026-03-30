import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptySearchStateProps {
  city?: string;
  onExpandSearch?: () => void;
  onBrowseAll?: () => void;
}

export function EmptySearchState({ city, onExpandSearch, onBrowseAll }: EmptySearchStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No providers found{city ? ` in ${city}` : ""}
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        Try expanding your search area or browse all available services.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        {onExpandSearch && (
          <Button variant="outline" onClick={onExpandSearch}>
            <MapPin className="h-4 w-4 mr-2" /> Expand search radius
          </Button>
        )}
        {onBrowseAll && (
          <Button onClick={onBrowseAll}>Browse all services</Button>
        )}
      </div>
    </div>
  );
}
