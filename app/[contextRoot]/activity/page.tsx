import { Metadata } from "next";
import Activity from "../../activity/activity";

export const metadata: Metadata = {
  title: "Activity | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootActivityPage() {
  return <Activity />;
}
