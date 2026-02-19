import { getUniverse, getThesisLevels } from "@/lib/data";
import WatchlistClient from "./watchlist-client";

export default function Watchlist() {
  return (
    <WatchlistClient
      universe={getUniverse()}
      levels={getThesisLevels()}
    />
  );
}
