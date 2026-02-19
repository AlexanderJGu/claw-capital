import { getUniverse, getRegime, getThesisLevels, getPredictions } from "@/lib/data";
import DashboardClient from "./dashboard-client";

export default function Dashboard() {
  return (
    <DashboardClient
      universe={getUniverse()}
      regime={getRegime()}
      levels={getThesisLevels()}
      predictions={getPredictions()}
    />
  );
}
