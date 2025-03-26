import { Metadata } from "next"
import ScoreInput from "./scoreInput"

export const metadata: Metadata = {
    title: "Score Input | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ScoreInputPage = () => {
    return <ScoreInput/>
}

export default ScoreInputPage