import { Metadata } from "next";
import EventResult from "../../eventResult/eventResult";

export const metadata: Metadata = {
  title: "Event Result | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootEventResultPage() {
  return <EventResult />;
}
