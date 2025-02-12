import { Metadata } from "next"
import Registration from "./teams"

export const metadata: Metadata = {
    title: "Result Input | Shoot Sunday",
}

const RegPage = () => {
    return <Registration/>
}

export default RegPage