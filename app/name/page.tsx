import { Metadata } from "next"
import Name from "./name"

export const metadata: Metadata = {
    title: "Name Game | "  + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ActivityPage = () => {
    return <Name/>
}

export default Name