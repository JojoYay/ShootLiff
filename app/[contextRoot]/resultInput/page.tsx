import { Metadata } from "next";
import TeamInput from "../../resultInput/teamInput";

export const metadata: Metadata = {
  title: "Team Input | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootResultInputPage() {
  return <TeamInput />;
}
