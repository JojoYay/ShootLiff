import { Metadata } from "next"
import InputPatificationFee from "./input"

export const metadata: Metadata = {
    title: "Input Patiication Fee | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const InputPatificationFeePage = () => {
    return <InputPatificationFee />
}

export default InputPatificationFeePage