import { Metadata } from "next";
import EventManager from "../../events/eventManager";

export const metadata: Metadata = {
  title: "Event Manager | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootEventsPage() {
  return <EventManager />;
}
