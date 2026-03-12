import { Metadata } from "next";
import Stats from "../../stats/stats";

export const metadata: Metadata = {
  title: "Stats | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootStatsPage() {
  return <Stats />;
}
