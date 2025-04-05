import { Invoice } from "./calendar";
import { User } from "./user";

export interface CalendarforCB {
    calendarId: string;
    eventType: string;
    eventName: string;
    startDatetime: string;
    endDatetime: string;
    place: string;
    remark: string;
    eventStatus: number;
    subTotal:number;
    cashBooks: CashBook[];
    isExpanded: boolean;
}

export interface CashBook {
    bookId: string;
    title: string;
    memo: string;
    payeeId: string;
    payee?: User | null;
    amount: number;
    balance: number;
    calendarId?: string;
    invoiceId?: string;
    lastUpdate: Date;
    updateUser?: User | null;
    create: Date;
    createUser?: User | null;
    invoice?: Payment | null;
    isExpanded: boolean;
}

export interface Payment {
    amount: number;
    folderName: string;
    id: string;
    image: string;
    memo: string;
    status: string;
    uploadDate: string;
    userName: string;
    isExpanded: boolean;
}