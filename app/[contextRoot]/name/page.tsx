import { Metadata } from "next";
import Name from "../../name/name";

export const metadata: Metadata = {
  title: "Name Game | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootNamePage() {
  return <Name />;
}
