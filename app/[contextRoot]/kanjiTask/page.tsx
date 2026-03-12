import { Metadata } from "next";
import KanjiTask from "../../kanjiTask/kanjiTask";

export const metadata: Metadata = {
  title: "KanjiTask | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootKanjiTaskPage() {
  return <KanjiTask />;
}
