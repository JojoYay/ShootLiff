import { User } from "./user";

export interface CalendarEvent {
    ID: string;
    event_type: string;
    event_name: string;
    start_datetime: string;
    end_datetime: string;
    place: string;
    remark: string;
    event_status: number;
    attendance?: Attendance | null;
    attendances?: Attendance[] | [];
}

export interface Attendance {
    attendance_id: string;
    user_id: string;
    year: string;
    month: string;
    date: string;
    status: string;
    calendar_id: string;
    calendar: CalendarEvent | null;
    profile?: User | null; // Profile を追加
    adult_count: number;
    child_count: number;
    child1?: string | boolean;
    child2?: string | boolean;
    child3?: string | boolean;
    child4?: string | boolean;
    child5?: string | boolean;
}

export interface Invoice {
    invoiceId: string;
    uploadDate: Date;
    userName: string;
    amount: number;
    memo: string;
    picUrl: string;
    status: '未清算'|'清算済';
}

export interface YTComment {
    author: string;
    comment: string;
    publishedAt: string;
}