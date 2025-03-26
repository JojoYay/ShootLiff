import { Metadata } from "next"
import Video from "./video"

export const metadata: Metadata = {
    title: "Video Footage | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const VideoPage = () => {
    return <Video/>
}

export default VideoPage