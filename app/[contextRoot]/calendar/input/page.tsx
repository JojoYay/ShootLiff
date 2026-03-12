import { Metadata } from "next";
import InputPatificationFee from "../../../calendar/input/input";

export const metadata: Metadata = {
  title: "Input Patiication Fee | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootCalendarInputPage() {
  return <InputPatificationFee />;
}
