import { Metadata } from "next"
import TeamInput from "./teamInput"

export const metadata: Metadata = {
    title: "Team Input | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const InputTeam = () => {
    return <TeamInput/>
}

export default InputTeam