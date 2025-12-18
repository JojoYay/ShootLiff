export interface User {
    userId: string;
    lineName:string;
    isKanji:boolean;
    displayName: string;
    pictureUrl?: string;
}

export type JsonUser = {
    "ライン上の名前": string;
    "伝助上の名前": string;
    "LINE ID": string;
    "幹事フラグ": string;
    "Picture": string;
    [key: string]: string; // その他のプロパティ用
};