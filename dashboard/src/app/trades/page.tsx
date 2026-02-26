import { getTradeIdeas } from "@/lib/data";
import { TradesClient } from "./trades-client";

export default function Trades() {
  const trades = getTradeIdeas();
  return <TradesClient trades={trades} />;
}
