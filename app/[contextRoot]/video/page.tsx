import { Metadata } from "next";
import Video from "../../video/video";

export const metadata: Metadata = {
  title: "Video Footage | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootVideoPage() {
  return <Video />;
}
