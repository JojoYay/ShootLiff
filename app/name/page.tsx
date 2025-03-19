import { Metadata } from "next"
import Name from "./name"

export const metadata: Metadata = {
    title: "Name Game | Shoot Sunday",
}

const ActivityPage = () => {
    return <Name/>
}

export default Name