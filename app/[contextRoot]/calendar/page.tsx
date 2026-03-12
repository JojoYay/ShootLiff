import { Metadata } from "next";
import Calendar from "../../calendar/calendar";

export const metadata: Metadata = {
  title: "Calendar | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootCalendarPage() {
  return <Calendar />;
}
