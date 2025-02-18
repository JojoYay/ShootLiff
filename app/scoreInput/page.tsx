import { Metadata } from "next"
import ScoreInput from "./scoreInput"

export const metadata: Metadata = {
    title: "Score Input | Shoot Sunday",
}

const ScoreInputPage = () => {
    return <ScoreInput/>
}

export default ScoreInputPage