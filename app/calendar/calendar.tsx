'use client';
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Box,
    Button,
    Collapse,
    DialogContent,
    DialogContentText,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography
} from '@mui/material';
import { useLiff } from '../liffProvider';
import { ChevronLeft, ChevronRight, ExpandMore, ExpandLess} from '@mui/icons-material';
import AvatarIcon from '../stats/avatarIcon';
import CalendarGrid from './calendarGrid';
import RegistrationDialog from './registrationDialog';

interface Profile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

interface CalendarEvent {
    ID: string;
    event_type: string;
    event_name: string;
    start_datetime: string;
    end_datetime: string;
    place: string;
    remark: string;
    recursive_type: number;
    attendance?: Attendance | null;
    attendances?: Attendance[] | [];
}

interface Attendance {
    attendance_id: string;
    user_id: string;
    year: string;
    month: string;
    date: string;
    status: string;
    calendar_id: string;
    calendar: CalendarEvent | null;
    profile?: Profile | null; // Profile を追加
}

export default function Calendar() {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // カレンダーイベントデータ
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    // const [participationStatus, setParticipationStatus] = useState<{ [eventId: string]: '〇' | '△' | '×' }>({}); // 参加状況
    const [pendingParticipationStatus, setPendingParticipationStatus] = useState<{ [eventId: string]: '〇' | '△' | '×' }>({}); // 保留中の参加状況
 
    const [profile, setProfile] = useState<Profile | null>(null);
    const [lang, setLang] = useState<string>('ja-JP');
	const [users, setUsers] = useState<string[][]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { liff } = useLiff();
    const [isProxyReplyMode, setIsProxyReplyMode] = useState<boolean>(false); // 代理返信モード state
    const [proxyReplyUser, setProxyReplyUser] = useState<Profile | null>(null); // 代理返信ユーザー state
    const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false); // リセット確認ダイアログ state // 追加

    useEffect(() => {
        if (liff) {
            liff.ready.then(() => {
                if (!liff.isLoggedIn()) {
                    const redirectUri = new URL(window.location.href).href;
                    liff.login({ redirectUri: redirectUri });
                } else {
                    liff.getProfile().then(profile => {
                        setProfile(profile);
                        setLang(liff.getLanguage());
                    });
                }
            });
        }
    }, [liff]);

    const [currentDate, setCurrentDate] = useState<Date>(new Date()); // MUI Scheduler用 state
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const [calendar, setCalendar] = useState<(string | { day: number, events: CalendarEvent[] })[][]>([]);
    const BALL:string = 'https://lh3.googleusercontent.com/d/1_snlf9rvRFpCg0nx4NlW57Z9PaGcPIn-';
    const BEER:string = 'https://lh3.googleusercontent.com/d/1XrzK_UDQHB25toU-Zg0dXauXbLF-AV1T';
    const LOGO:string = 'https://lh3.googleusercontent.com/d/1584yt922MfDFclQ9XX0MvtN91KhmQdu2';
    const [expandedEventDetails, setExpandedEventDetails] = useState<{[eventId: string]: boolean}>({});
    const [isRegistering, setIsRegistering] = useState(false);


    // 月または年が変わったときにカレンダーを再生成
    useEffect(() => {
        if(profile?.userId){
            setCalendar(generateCalendar(currentDate, calendarEvents, attendance, profile?.userId));
        }
    }, [currentDate, calendarEvents, attendance, profile?.userId]);

    // 月を移動する関数
    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    // generateCalendar関数内のイベント生成部分を修正
    function generateCalendar(date: Date, calendarEvents: CalendarEvent[], attendance: Attendance[], userId: string | null | undefined) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
        const daysInMonth = lastDayOfMonth.getDate();
        const calendarDays: (string | { day: number, events: CalendarEvent[] })[][] = [];
        let week: (string | { day: number, events: CalendarEvent[] })[] = [];

        // 先月の日付を埋める
        for (let i = 0; i < firstDayOfWeek; i++) {
            week.push('');
        }
        // 今月の日付を埋める
        for (let day = 1; day <= daysInMonth; day++) {
            const calendarDate = new Date(year, month, day);
            let dayEvents: CalendarEvent[] = [];
            calendarEvents.forEach((event) => {
                const eventStartDate = new Date(event.start_datetime);
                if (eventStartDate.getDate() === day && eventStartDate.getMonth() === month && eventStartDate.getFullYear() === year) {
                    const pendingStatus = pendingParticipationStatus[event.ID];
                    const existingAttendance = getAttendanceForDayAndEvent(eventStartDate, attendance, event.ID, userId);
                    
                    const newEvent: CalendarEvent = {
                        ...event,
                        attendance: pendingStatus ? (existingAttendance ? {
                            ...existingAttendance,
                            status: pendingStatus
                        } : {
                            attendance_id: '',
                            user_id: profile?.userId ? profile.userId : '',
                            year: String(eventStartDate.getFullYear()),
                            month: String(eventStartDate.getMonth() + 1),
                            date: String(eventStartDate.getDate()),
                            calendar_id: event.ID,
                            status: pendingStatus,
                            calendar: null,
                            profile: null
                        }) : existingAttendance,
                        attendances: getAllAttendanceForDayAndEvent(eventStartDate, attendance, event.ID, users)
                    };
                    dayEvents.push(newEvent);
                }
            });
            week.push({ day: day, events: dayEvents });
            if (week.length === 7) {
                calendarDays.push([...week]);
                week = [];
            }
        }

        // 翌月の日付を埋める (必要に応じて)
        while (week.length < 7 && week.length > 0) {
            week.push('');
        }
        if (week.length > 0) {
            calendarDays.push(week);
        }
        while (calendarDays.length < 6) {
            calendarDays.push(Array(7).fill(''));
        }
        return calendarDays;
    }

    // 日付とイベントIDに該当する参加ステータスを取得する関数
    function getAttendanceForDayAndEvent(date: Date, attendance: Attendance[], eventId: string, userId: string | undefined | null): Attendance | null {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 月は0から始まるため+1
        const day = date.getDate();
        const userAttendance = attendance.find(
            (attend) =>
            attend.user_id === userId &&
            attend.calendar_id === eventId && // eventId でフィルタリング
            parseInt(attend.year) === year &&
            parseInt(attend.month) === month &&
            parseInt(attend.date) === day
        );

        return userAttendance || null; // 参加ステータスを返す、ない場合は null
    }

    // 日付とイベントIDに該当する参加ステータスを取得する関数
    function getAllAttendanceForDayAndEvent(date: Date, attendance: Attendance[], eventId: string, users: string[][]): Attendance[] { // users を引数に追加
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 月は0から始まるため+1
        const day = date.getDate();

        const userAttendances: Attendance[] = attendance.filter(
            (attend) =>
            attend.calendar_id === eventId && // eventId でフィルタリング
            parseInt(attend.year) === year &&
            parseInt(attend.month) === month &&
            parseInt(attend.date) === day
        ).map(attend => { // map で Profile 情報を追加
            const user = users.find(u => u[2] === attend.user_id); // users から user_id に一致するユーザーを検索
            const profile: Profile | null = user ? { // Profile オブジェクトを作成
                userId: user[2],
                displayName: user[1],
                pictureUrl: user[4],
            } : null;
            return {
                ...attend,
                profile: profile, // Profile 情報を Attendance オブジェクトに追加
            };
        });

        return userAttendances; // 参加ステータスリストを返す // ユーザーの参加リストを返すように変更
    }

    useEffect(() => {
        fetchCalendarEvents();
    }, []);

    const fetchCalendarEvents = async () => {
        try {
            let url = process.env.SERVER_URL + `?func=loadCalendar&func=getUsers&func=getAttendance`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log('Calendar Events:', data);
                let processedCalendarEvents: CalendarEvent[] = data.calendar.slice(1).map((item: string[]) => ({
                    ID: item[0],
                    event_type: item[1],
                    event_name: item[2],
                    start_datetime: item[3],
                    end_datetime: item[4],
                    place: item[5],
                    remark: item[6],
                    event_status: item[7],
                }));
                // console.log(processedCalendarEvents);
                setCalendarEvents(processedCalendarEvents);
                setUsers(data.users.slice(1));
                const fetchedAttendance = data.attendance.slice(1).map((item: string[]) => {
                    const calendar_id = item[6];
                    const relatedCalendarEvent = processedCalendarEvents.find(event => event.ID === calendar_id); // calendar_id に一致する CalendarEvent を検索
                    return {
                        attendance_id: item[0],
                        user_id: item[1],
                        year: item[2],
                        month: item[3],
                        date: item[4],
                        status: item[5],
                        calendar_id: item[6],
                        calendar: relatedCalendarEvent,
                    };
                });
                // console.log(fetchedAttendance);
                setAttendance(fetchedAttendance);
            }
            // console.log('calendar loaded with attendance');
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        }
    };

    const handleParticipationChange = async (calendar: CalendarEvent, status: '〇' | '△' | '×', userId: string | undefined) => {
        setPendingParticipationStatus(prevState => ({
            ...prevState,
            [calendar.ID]: status,
        }));
        console.log(calendar.ID + ':' + status);
        // 既存のattendanceを更新
        setAttendance(prevAttendance => {
            const startDate = new Date(calendar.start_datetime as string);
            const existingIndex = prevAttendance.findIndex(att => 
                att.user_id === userId &&
                att.calendar_id === calendar.ID &&
                parseInt(att.year) === startDate.getFullYear() &&
                parseInt(att.month) === (startDate.getMonth() + 1) &&
                parseInt(att.date) === startDate.getDate()
            );
    
            const newAtt: Attendance = {
                attendance_id: existingIndex >= 0 ? prevAttendance[existingIndex].attendance_id : '',
                user_id: userId || '',
                year: String(startDate.getFullYear()),
                month: String(startDate.getMonth() + 1),
                date: String(startDate.getDate()),
                status: status,
                calendar_id: calendar.ID,
                calendar: calendar
            };
    
            if (existingIndex >= 0) {
                // 既存のattendanceを更新
                const updatedAttendance = [...prevAttendance];
                updatedAttendance[existingIndex] = newAtt;
                return updatedAttendance;
            } else {
                // 新しいattendanceを追加
                return [...prevAttendance, newAtt];
            }
        });
    };

    const handleSaveParticipation = async () => {
        try {
            setIsSaving(true); // 保存処理開始時にボタンを無効化
            let url = process.env.SERVER_URL;
            if (url && profile) {
                const formData = new FormData();
                formData.append('func', 'updateParticipation');
                
                // attendance配列から該当する参加情報を検索するヘルパー関数
                const findAttendance = (eventId: string, date: Date, userId: string) => {
                    return attendance.find(att => 
                        att.calendar_id === (eventId.includes('_') ? eventId.split('_')[0] : eventId) &&
                        parseInt(att.year) === date.getFullYear() &&
                        parseInt(att.month) === (date.getMonth() + 1) &&
                        parseInt(att.date) === date.getDate() &&
                        att.user_id === userId
                    );
                };

                const userIdToUse = proxyReplyUser ? proxyReplyUser.userId : profile.userId;

                Object.entries(pendingParticipationStatus).forEach(([eventId, status], index) => {
                    const eid = eventId.includes('_') ? eventId.split('_')[0] : eventId;
                    const cal = calendarEvents.find(event => event.ID.toString() === eid);

                    if (cal) {
                        const startDate = new Date(cal.start_datetime as string);
                        const existingAttendance = findAttendance(eventId, startDate, userIdToUse);
    
                        formData.append('calendar_id_'+index, eid);
                        formData.append('year_'+index, String(startDate.getFullYear()));
                        formData.append('month_'+index, String(startDate.getMonth() + 1));
                        formData.append('date_'+index, String(startDate.getDate()));
                        formData.append('attendance_id_'+index, existingAttendance?.attendance_id || '');
                        formData.append('user_id_'+index, userIdToUse);
                        formData.append('status_'+index, status);
                    } else {
                        console.error(`Calendar event with ID ${eventId} not found in calendarEvents.`);
                    }
                });

                for (const pair of Array.from(formData.entries())) {
                    console.log(pair[0] + ', ' + pair[1]);
                }

                const responses = await Promise.all([
                    fetch(url, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                        },
                    })
                ]);
                const allOk = responses.every(response => response.ok);

                if (allOk) {
                    setPendingParticipationStatus({}); // 保留中のステータスをクリア
                    fetchCalendarEvents();
                } else {
                    console.error('Failed to update some participation statuses');
                }
            }
        } catch (error) {
            console.error('Error updating participation statuses:', error);
        } finally {
            setIsSaving(false); // 保存処理完了時にボタンを有効化
        }
    };


    const handleToggleDetails = (eventId: string) => { // トグルボタンの処理関数 // 追加
        setExpandedEventDetails(prevState => ({
            ...prevState,
            [eventId]: !prevState[eventId],
        }));
    };

    const SaveButton = () => (
        <Button 
            variant="contained" 
            color="primary" 
            size="small"
            onClick={handleSaveParticipation}
            disabled={isSaving}
            sx={{ 
                ml: 1,
                minWidth: '40px', // 幅を指定
                px: 1 // 左右のパディングを縮小
            }}
        >
            {lang === 'ja-jP' ? '保存' : 'Save'}
        </Button>
    );
   
    // 次回のイベントを取得する関数を追加
    const getNextEvent = (): CalendarEvent | null => {
        const now = new Date();
        let nextEvent: CalendarEvent | null = null;
        let earliestDate: Date | null = null;

        calendarEvents.forEach(event => { // calendarEvents を直接参照するように変更
            const eventDate = new Date(event.start_datetime);
            if (eventDate >= now) {
                if (!earliestDate || eventDate < earliestDate) {
                    earliestDate = eventDate;
                    // nextEvent = event;
                    nextEvent = {
                        ...event,
                        attendance: getAttendanceForDayAndEvent(eventDate, attendance, event.ID, profile?.userId), // attendance を追加
                        attendances: getAllAttendanceForDayAndEvent(eventDate, attendance, event.ID, users)
                    };
                }
            }
        });

        return nextEvent;
    };

    const ProxyReplyButton = () => ( // 代理返信モード切り替えボタン
        <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
                if (Object.keys(pendingParticipationStatus).length > 0) { // 保留中のステータスがある場合
                    setIsResetDialogOpen(true); // 確認ダイアログを開く
                } else {
                    setIsProxyReplyMode(!isProxyReplyMode); // モード切り替え
                    if (!isProxyReplyMode) { // Proxyモードに入る際にproxyReplyUserをクリア
                        setProxyReplyUser(null);
                    }
                }
            }}
            sx={{
                ml: 1,
                minWidth: '30px', // 幅を指定
                px: 1, // 左右のパディングを縮小
                backgroundColor: isProxyReplyMode ? 'rgba(156, 39, 176, 0.08)' : 'transparent', // 背景色も変更
                '&:hover': {
                    backgroundColor: isProxyReplyMode ? 'rgba(156, 39, 176, 0.12)' : undefined,
                }
            }}
        >
            {lang === 'ja-JP' ? '代' : 'P'}
        </Button>
    );


    const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
    const [nickname, setNickname] = useState('');
    const [nicknameError, setNicknameError] = useState('');

    useEffect(() => {
        if (profile && users.length > 0) {
            const userExists = users.some(user => user[2] === profile.userId);
            if (!userExists) {
                setNickname(profile.displayName || '');
                setShowRegistrationDialog(true);
            }
        }
    }, [profile, users]);

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
        setNicknameError('');
    };

    const handleRegister = () => {
        try{
            setIsRegistering(true);
            const isNameTaken = users.some(user => user[1] === nickname);
            if (isNameTaken) {
                setNicknameError('This nickname is already in use.');
            } else {
                setIsRegistering(true); // 登録処理開始時にtrueにする
                const formData = new FormData();
                formData.append('func', 'registrationFromApp');
                formData.append('userId', profile?.userId || '');
                formData.append('nickname', nickname);
                formData.append('line_name',profile?.displayName || '');
                formData.append('pic_url', profile?.pictureUrl || '');
                if(process.env.SERVER_URL){
                    fetch(process.env.SERVER_URL, {
                        method: 'POST',
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Registration successful:', data);
                        setShowRegistrationDialog(false); // 成功時にダイアログを閉じる
                        setIsRegistering(false); // 成功時にfalseに戻す
                    })
                    .catch(error => {
                        console.error('Registration failed:', error);
                        setIsRegistering(false); // エラー時にもfalseに戻す
                    });
                }
            }
        } finally {
            setIsRegistering(false);
        }
        
    };

    function renderRemarkWithLinks(remark: string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = remark.split(urlRegex);
    
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                        {part}
                    </a>
                );
            }
            return part;
        });
    }

    return (
        <>
            {(calendarEvents.length > 0 && profile)? (
                <>
                    <Grid container spacing={1} justifyContent="center" alignItems="center">
                        {/* 次回イベントの表示を追加 */}
                        <Grid item xs={12}>
                            {(() => {
                                const nextEvent = getNextEvent();
                                console.log(nextEvent);
                                if (nextEvent) {
                                    return (
                                        <Paper elevation={3} sx={{
                                            p: 2,
                                            m: 2,
                                            bgcolor: '#e8eaf6',
                                            borderRadius: '10px',
                                            border: '1px solid #c5cae9'
                                        }}>
                                            {/* ヘッダー部分を横並びに */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="h6" sx={{ color: '#3f51b5' }}>
                                                        {lang === 'ja-JP' ? '次回の予定' : 'Next Event'}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleDetails('next_event')}
                                                        sx={{ color: '#3f51b5' }}
                                                    >
                                                        {expandedEventDetails['next_event'] ? <ExpandLess /> : <ExpandMore />}
                                                    </IconButton>
                                                </Box>
                                                <Box>
                                                    {Object.keys(pendingParticipationStatus).length > 0 && <SaveButton />}
                                                    <ProxyReplyButton />
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {nextEvent.event_type === 'フットサル' && (
                                                        <img src={BALL} alt="フットサル" width={32} height={32} />
                                                    )}
                                                    {nextEvent.event_type === '飲み会' && (
                                                        <img src={BEER} alt="飲み会" width={32} height={32} />
                                                    )}
                                                    {nextEvent.event_type === 'いつもの' && (
                                                        <img src={LOGO} alt="いつもの" width={32} height={32} />
                                                    )}
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ color: '#424242' }}>
                                                        {new Date(nextEvent.start_datetime).toLocaleDateString(lang, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            weekday: 'long'
                                                        })}
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#424242', mb: 2 }}>
                                                        {nextEvent.event_name} @ {nextEvent.place}
                                                    </Typography>
                                                    <Typography variant="body1" style={{ color: '#757575', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                        {renderRemarkWithLinks(nextEvent.remark)}
                                                    </Typography>
                                                    {/* 参加者選択コンボボックス（代理返信モード時のみ表示） */}
                                                    {isProxyReplyMode && (
                                                        <FormControl fullWidth margin="dense" size="small">
                                                            <InputLabel id="proxy-user-select-label">{lang === 'ja-JP' ? '代理ユーザーを選択' : 'Select Proxy User'}</InputLabel>
                                                            <Select
                                                                labelId="proxy-user-select-label"
                                                                id="proxy-user-select"
                                                                value={proxyReplyUser ? proxyReplyUser.userId : ''}
                                                                label={lang === 'ja-JP' ? '代理ユーザーを選択' : 'Select Proxy User'}
                                                                onChange={(e) => {
                                                                    const selectedUser = users.find(user => user[2] === e.target.value);
                                                                    if (selectedUser) {
                                                                        setProxyReplyUser({
                                                                            userId: selectedUser[2],
                                                                            displayName: selectedUser[1],
                                                                            pictureUrl: selectedUser[4],
                                                                        });
                                                                    } else {
                                                                        setProxyReplyUser(null);
                                                                    }
                                                                }}
                                                            >
                                                                {users.map((user, index) => (
                                                                    <MenuItem key={index} value={user[2]}>
                                                                        {user[1]}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                    {/* 参加ステータス選択 */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                        <Typography variant="body2" sx={{ color: '#424242' }}>
                                                            {lang === 'ja-JP' ? '参加状況:' : 'Participation:'}
                                                        </Typography>
                                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                                            <Select
                                                                value={
                                                                    isProxyReplyMode && proxyReplyUser
                                                                        ? (nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId)?.status || '')
                                                                        : (nextEvent.attendance?.status || '')
                                                                }
                                                                onChange={(e) => {
                                                                    handleParticipationChange(
                                                                        nextEvent,
                                                                        e.target.value as '〇' | '△' | '×',
                                                                        isProxyReplyMode ? proxyReplyUser?.userId : profile?.userId // ユーザーIDを渡す
                                                                    );
                                                                }}
                                                                disabled={isProxyReplyMode && !proxyReplyUser} // 代理返信モードでユーザーが選択されていない場合はdisabled
                                                            >
                                                                <MenuItem value={'〇'}>〇</MenuItem>
                                                                <MenuItem value={'△'}>△</MenuItem>
                                                                <MenuItem value={'×'}>×</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                    <Collapse in={expandedEventDetails['next_event']} timeout="auto" unmountOnExit>
                                                        {/* 参加者リスト */}
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ color: '#424242', display: 'flex', alignItems: 'center' }}>
                                                                    {lang === 'ja-JP' ? '参加' : 'Attend'} ({nextEvent.attendances?.filter(att => att.status === '〇').length || 0}):
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                    {nextEvent.attendances?.filter(att => att.status === '〇').map((attend, index) => (
                                                                        <AvatarIcon
                                                                            key={index}
                                                                            name={attend.profile?.displayName || ''}
                                                                            picUrl={attend.profile?.pictureUrl}
                                                                            width={24}
                                                                            height={24}
                                                                            showTooltip={true}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ color: '#424242' }}>
                                                                    {lang === 'ja-JP' ? '保留' : 'Pending'} ({nextEvent.attendances?.filter(att => att.status === '△').length || 0}):
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                    {nextEvent.attendances?.filter(att => att.status === '△').map((attend, index) => (
                                                                        <AvatarIcon
                                                                            key={index}
                                                                            name={attend.profile?.displayName || ''}
                                                                            picUrl={attend.profile?.pictureUrl}
                                                                            width={24}
                                                                            height={24}
                                                                            showTooltip={true}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ color: '#424242' }}>
                                                                    {lang === 'ja-JP' ? '不参加' : 'Absent'} ({nextEvent.attendances?.filter(att => att.status === '×').length || 0}):
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                    {nextEvent.attendances?.filter(att => att.status === '×').map((attend, index) => (
                                                                        <AvatarIcon
                                                                            key={index}
                                                                            name={attend.profile?.displayName || ''}
                                                                            picUrl={attend.profile?.pictureUrl}
                                                                            width={24}
                                                                            height={24}
                                                                            showTooltip={true}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Collapse>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                }
                                return null;
                            })()}
                        </Grid>

                        <Dialog // 確認ダイアログを追加
                            open={isResetDialogOpen}
                            onClose={() => setIsResetDialogOpen(false)}
                            aria-labelledby="reset-dialog-title"
                            aria-describedby="reset-dialog-description"
                        >
                            <DialogTitle id="reset-dialog-title">
                                {lang === 'ja-JP' ? "変更のリセット" : "Reset Proxy Reply Mode"}
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText id="reset-dialog-description">
                                    {lang === 'ja-JP' ? "モードを切り替えるため、今までの変更は破棄されます。リセットしてもよろしいですか？" : "Are you sure you want to reset changes to switch mode?"}
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setIsResetDialogOpen(false)} color="primary">
                                    {lang === 'ja-JP' ? 'キャンセル' : 'Cancel'}
                                </Button>
                                <Button onClick={() => {
                                    setIsResetDialogOpen(false); // ダイアログを閉じる
                                    setIsProxyReplyMode(!isProxyReplyMode); // 代理返信モードを無効にする
                                    setProxyReplyUser(null);     // 代理ユーザーをクリア
                                    setPendingParticipationStatus({}); // 保留中のステータスもクリア (オプション)
                                }} color="primary">
                                    {lang === 'ja-JP' ? 'リセット' : 'Reset'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* カレンダー表示領域 */}
                        <Grid item xs={12} style={{ textAlign: 'center' }}>
                            <Typography variant="h4" component="div" sx={{ textAlign: 'center', color: '#3f51b5' }}> 
                               {lang === 'ja-JP' ? 'スケジュール' : 'Schedule'}
                            </Typography>
                        </Grid>

                        {/* カレンダーナビゲーション */}
                        <Grid item xs={12} style={{ textAlign: 'center' }}>
                            <Paper elevation={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: '20px' }}>
                                <IconButton onClick={goToPreviousMonth} aria-label="previous month" style={{ color: '#3f51b5' }}>
                                    <ChevronLeft />
                                </IconButton>
                                <Typography variant="h6" component="div" sx={{ mx: 2, color: '#3f51b5', fontWeight: 'bold' }}> 
                                    {currentDate.getFullYear()}/{currentDate.getMonth() + 1}
                                </Typography>
                                <IconButton onClick={goToNextMonth} aria-label="next month" style={{ color: '#3f51b5' }}> 
                                    <ChevronRight />
                                </IconButton>
                            </Paper>
                        </Grid>

                        {/* カレンダーグリッド */}
                        <CalendarGrid calendar={calendar} daysOfWeek={daysOfWeek} currentDate={currentDate} BALL={BALL} BEER={BEER} LOGO={LOGO} />

                        <Grid item xs={12}>
                            <Box textAlign="center" m={'8px'} p={'8px'} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h6" component="div" sx={{ textAlign: 'center', color: '#3f51b5', fontWeight: 'bold' }}> 
                                    {lang === 'ja-JP' ? '出席データ' : 'Attendance Data'}
                                </Typography>
                                {Object.keys(pendingParticipationStatus).length > 0 && <SaveButton />}
                            </Box>
                            
                            <Grid container spacing={2}>
                                {calendar.map((week, weekIndex) => (
                                    <Grid container key={weekIndex}>
                                        {week.map((dayData, dayIndex) => (
                                            <>
                                                {typeof dayData === 'object' && dayData.events.length > 0 && dayData.events.map((calendar, index) => (
                                                    <Grid item xs={12} sm={6} md={4} key={index} sx={{border: '1px solid #eee', backgroundColor: '#fffde7', borderRadius: '8px', padding:'5px' }}>
                                                        <Box sx={{ margin:'5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                {calendar.event_type === 'フットサル' && (
                                                                    <img src={BALL} alt="フットサル" width={28} height={28} style={{margin:'5px'}} />
                                                                )}
                                                                {calendar.event_type === '飲み会' && (
                                                                    <img src={BEER} alt="飲み会" width={28} height={28} style={{margin:'5px'}} />
                                                                )}
                                                                {calendar.event_type === 'いつもの' && (
                                                                    <img src={LOGO} alt="いつもの" width={28} height={28} style={{margin:'5px'}} />
                                                                )}
                                                                <Typography variant="h6" sx={{ margin:'5px', color: '#757575', minWidth:'155px'}}>
                                                                    {new Date(calendar.start_datetime).toLocaleDateString(lang, { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit',minute:'2-digit',hour12:false }).replace(/-/g,'/')}
                                                                </Typography>
                                                                <FormControl size="small" >
                                                                    <InputLabel id="status-select-label">参加可否</InputLabel>
                                                                    <Select
                                                                        labelId="status-select-label"
                                                                        id="status-select"
                                                                        value={calendar.attendance?.status || ''}
                                                                        label={lang === 'ja-JP' ? 'ステータス' : 'Status'}
                                                                        onChange={(e) => {
                                                                            if(calendar.ID){
                                                                                handleParticipationChange(calendar, e.target.value as '〇' | '△' | '×', profile?.userId);
                                                                                if(calendar.attendance){
                                                                                    calendar.attendance.status = e.target.value as '〇' | '△' | '×';
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <MenuItem value={'〇'}>〇</MenuItem>
                                                                        <MenuItem value={'△'}>△</MenuItem>
                                                                        <MenuItem value={'×'}>×</MenuItem>
                                                                    </Select>
                                                                </FormControl>
                                                            </Box>
                                                            <IconButton // トグルボタン
                                                                aria-label="expand"
                                                                size="small"
                                                                onClick={() => handleToggleDetails(calendar.ID)}
                                                            >
                                                                {expandedEventDetails[calendar.ID] ? <ExpandLess /> : <ExpandMore />}
                                                            </IconButton>
                                                        </Box>
                                                        <Collapse in={expandedEventDetails[calendar.ID]} timeout="auto" unmountOnExit>
                                                            <Box sx={{ m: '5px' }}>
                                                                <Typography variant="body1" style={{ color: '#757575' }}>{calendar.event_name}</Typography>
                                                                <Typography variant="body1" style={{ color: '#757575' }}>{calendar.place}</Typography>
                                                                <Typography variant="body1" style={{ color: '#757575', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                                    {renderRemarkWithLinks(calendar.remark)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ m: '5px', display: 'flex', flexDirection: 'column' }}>
                                                                <Typography variant="subtitle2" style={{ color: '#757575', fontWeight: 'bold' }}>{lang === 'ja-JP' ? '参加者' : 'Attendees'}:
                                                                    <Typography variant="caption" style={{ color: '#757575', fontWeight: 'normal' }}> ({calendar.attendances?.filter(att => att.status === '〇').length || 0})</Typography>
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1 }}>
                                                                    {calendar.attendances?.filter(att => att.status === '〇').map((attend, index) => (
                                                                        <AvatarIcon key={index} name={attend.profile?.displayName || ''} picUrl={attend.profile?.pictureUrl}  width={24} height={24} showTooltip={true} />
                                                                    ))}
                                                                </Box>

                                                                <Typography variant="subtitle2" style={{ color: '#757575', fontWeight: 'bold' }}>{lang === 'ja-JP' ? '保留' : 'Pending'}:
                                                                    <Typography variant="caption" style={{ color: '#757575', fontWeight: 'normal' }}> ({calendar.attendances?.filter(att => att.status === '△').length || 0})</Typography>
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1 }}>
                                                                    {calendar.attendances?.filter(att => att.status === '△').map((attend, index) => (
                                                                        <AvatarIcon key={index} name={attend.profile?.displayName || ''} picUrl={attend.profile?.pictureUrl}  width={24} height={24} showTooltip={true} />
                                                                    ))}
                                                                </Box>

                                                                <Typography variant="subtitle2" style={{ color: '#757575', fontWeight: 'bold' }}>{lang === 'ja-JP' ? '不参加' : 'Absent'}:
                                                                    <Typography variant="caption" style={{ color: '#757575', fontWeight: 'normal' }}> ({calendar.attendances?.filter(att => att.status === '×').length || 0})</Typography>
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                    {calendar.attendances?.filter(att => att.status === '×').map((attend, index) => (
                                                                        <AvatarIcon key={index} name={attend.profile?.displayName || ''} picUrl={attend.profile?.pictureUrl}  width={24} height={24} showTooltip={true} />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        </Collapse>
                                                    </Grid>
                                                ))}
                                            </>
                                        ))}
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </Grid>
                </>
            ) : (
				<Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}>
					<Box sx={{
                        '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                        },
                    }}>
                        <img
                            src="https://lh3.googleusercontent.com/d/1THCGfK2zDU5Vp1dAMgew8VTFV1soE-x7"
                            alt="ローディング"
                            style={{
                                width: '48px',
                                height: '48px',
                                animation: 'spin 2s linear infinite',
                            }}
                        />
                    </Box>
				</Box>
            )}
            {showRegistrationDialog && (
                <RegistrationDialog
                    nickname={nickname}
                    onNicknameChange={handleNicknameChange}
                    onRegister={handleRegister}
                    nicknameError={nicknameError}
                    disabledM={isRegistering}
                    onClose={() => setShowRegistrationDialog(false)} // ダイアログを閉じるための関数を渡す
                />
            )}
        </>
    );
}