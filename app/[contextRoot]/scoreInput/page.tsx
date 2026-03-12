import { Metadata } from "next";
import ScoreInput from "../../scoreInput/scoreInput";

export const metadata: Metadata = {
  title: "Score Input | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootScoreInputPage() {
  return <ScoreInput />;
}
