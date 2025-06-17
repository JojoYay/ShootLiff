import { Metadata } from "next"
import Registration from "./registration"
import { LiffProvider } from "../liffProvider"

export const metadata: Metadata = {
    title: "Account Info | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const RegistrationPage = () => {
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <Registration />
        </LiffProvider>
    )
}

export default RegistrationPage