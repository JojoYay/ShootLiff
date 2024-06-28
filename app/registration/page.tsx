import { Metadata } from "next"
import Registration from "./registration"

export const metadata: Metadata = {
    title: "Sign Up | Shoot Sunday",
}

const RegPage = () => {
    return <Registration/>
}

export default RegPage