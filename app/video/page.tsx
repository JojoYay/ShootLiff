import { Metadata } from "next"
import Video from "./video"

export const metadata: Metadata = {
    title: "Video Footage | Shoot Sunday",
}

const VideoPage = () => {
    return <Video/>
}

export default VideoPage