import { Metadata } from "next";
import CashBookPage from "../../cashBook/cashBook";

export const metadata: Metadata = {
  title: "Cash Book | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootCashBookPage() {
  return <CashBookPage />;
}
