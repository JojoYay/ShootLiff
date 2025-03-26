import { Metadata } from "next"
import Test from "./test"

export const metadata: Metadata = {
    title: "Test | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ActivityPage = () => {
    return <Test/>
}

export default Test