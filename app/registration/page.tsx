import { Metadata } from "next"
import Registration from "./registration"

export const metadata: Metadata = {
    title: "Account Info | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const RegPage = () => {
    return <Registration/>
}

export default RegPage