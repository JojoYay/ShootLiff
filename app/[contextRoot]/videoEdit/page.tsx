import { Metadata } from "next";
import VideoEdit from "../../videoEdit/videoEdit";

export const metadata: Metadata = {
  title: "VideoEdit | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootVideoEditPage() {
  return <VideoEdit />;
}
