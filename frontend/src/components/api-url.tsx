import useApiUrl from "@/hooks/useApiUrl";
import { Badge } from "./ui/badge";

export default function APIUrl() {
  const { apiUrl } = useApiUrl();
  return (
    <div>
      <div className="text-sm">
        <Badge className="shrink-0 max-h-min" variant="secondary">
          {apiUrl}
        </Badge>
      </div>
    </div>
  );
}
