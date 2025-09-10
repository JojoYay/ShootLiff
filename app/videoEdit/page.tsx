import { Metadata } from "next"
import { LiffProvider } from "../liffProvider"
import VideoEdit from "./videoEdit"

export const metadata: Metadata = {
    title: "VideoEdit | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const VideoEditPage = () => {
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <VideoEdit/>
        </LiffProvider>
    )
}

export default VideoEditPage 