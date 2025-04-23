import { Metadata } from "next"
import Activity from "./activity"

export const metadata: Metadata = {
    title: "Activity | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

 

const ActivityPage = () => {
    // const { google } = require('googleapis');
    // const OAuth2 = google.auth.OAuth2;
    
    // const oauth2Client = new OAuth2(
    //     "355199207344-o26o7g67f7jpi0engcqug08d4sq4rldc.apps.googleusercontent.com",
    //     "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",
    //     "https://test-8120f.web.app/activity?func="
    // );

    // // 認証URLを生成
    // const authUrl = oauth2Client.generateAuthUrl({
    //     access_type: 'offline',
    //     scope: ['https://www.googleapis.com/auth/youtube.upload'],
    // });
  
    // // ユーザーを認証URLにリダイレクト
    // console.log('Authorize this app by visiting this url:', authUrl);

    // // 認証コードを取得した後
    // const code = 'YOUR_AUTHORIZATION_CODE'; // ユーザーから取得した認証コード
    // // const { tokens } = await oauth2Client.getToken(code);
    // const getToken = async (code:string) => {
    //     const tokens = await oauth2Client.getToken(code);
    //     return tokens;
    // } 
    // const tokens:any = getToken(code); 
    // oauth2Client.setCredentials(tokens);

    // console.log('Access Token:', tokens.access_token);

    // return <Activity token={tokens}/>
    return <Activity />
}

export default ActivityPage