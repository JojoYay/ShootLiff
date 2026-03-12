import { Metadata } from "next";
import Registration from "../../registration/registration";

export const metadata: Metadata = {
  title: "Account Info | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootRegistrationPage() {
  return <Registration />;
}
