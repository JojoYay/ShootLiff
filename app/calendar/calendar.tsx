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
import LoadingSpinner from './loadingSpinner';
import Comment from './comment';
import { Attendance, CalendarEvent } from '../types/calendar';
import { User } from '../types/user';
import { BALL, BEER, LOGO } from '../utils/constants';
import { NextEventCard } from './nextEventCard';
import { useRouter } from 'next/navigation';
import AddCalendarButton from './addCalendar';
import AttendanceList from './attendanceList';

export default function Calendar() {
    const router = useRouter();
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // カレンダーイベントデータ
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    // const [participationStatus, setParticipationStatus] = useState<{ [eventId: string]: '〇' | '△' | '×' }>({}); // 参加状況
    const [pendingParticipationStatus, setPendingParticipationStatus] = useState<{ [eventId: string]: '〇' | '△' | '×' }>({}); // 保留中の参加状況
    const [pendingParticipationStatusCount, setPendingParticipationStatusCount] = useState<{ [eventId: string]: {adult:number, child:number} }>({}); // 保留中のカウント
 
    const [profile, setProfile] = useState<User | null>(null);
    const [lang, setLang] = useState<string>('ja-JP');
	const [users, setUsers] = useState<string[][]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { liff } = useLiff();
    const [isProxyReplyMode, setIsProxyReplyMode] = useState<boolean>(false); // 代理返信モード state
    const [proxyReplyUser, setProxyReplyUser] = useState<User | null>(null); // 代理返信ユーザー state
    const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false); // リセット確認ダイアログ state // 追加

    useEffect(() => {
        if (liff) {
            liff.ready.then(() => {
                if (!liff.isLoggedIn()) {
                    const redirectUri = new URL(window.location.href).href;
                    liff.login({ redirectUri: redirectUri });
                } else {
                    liff.getProfile().then(profile => {
                        const user: User = {
                            userId: profile.userId, // Assuming profile has userId
                            lineName: profile.displayName || '', // Map displayName to lineName
                            isKanji: false, // Set this based on your logic
                            displayName: profile.displayName || '',
                            pictureUrl: profile.pictureUrl || '',
                        };
                        setProfile(user);
                        setLang(liff.getLanguage());
                    });
                }
            });
        }
    }, [liff]);

    const [currentDate, setCurrentDate] = useState<Date>(new Date()); // MUI Scheduler用 state
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const [calendar, setCalendar] = useState<(string | { day: number, events: CalendarEvent[] })[][]>([]);
    const [expandedEventDetails, setExpandedEventDetails] = useState<{[eventId: string]: boolean}>({});

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
                    console.log('existing Attendance',existingAttendance);
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
                            profile: null,
                            adult_count: 1,
                            child_count: 0,
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
        console.log(calendarDays);
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
            const profile: User | null = user ? { // User オブジェクトを作成
                userId: user[2],
                lineName:user[0],
                isKanji:user[3] === '幹事',
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
                        adult_count: item[7],
                        child_count: item[8],
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

    const handleParticipationChange = async (calendar: CalendarEvent, status: '〇' | '△' | '×', userId: string | undefined, adultCount:number, childCount:number) => {
        setPendingParticipationStatus(prevState => ({
            ...prevState,
            [calendar.ID]: status,
        }));
        setPendingParticipationStatusCount(prevState => ({
            ...prevState,
            [calendar.ID]: {adult:adultCount, child:childCount},
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
                calendar: calendar,
                adult_count: adultCount,
                child_count: childCount
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
                        console.log("existing_attendance")
                        console.log(existingAttendance);
                        formData.append('calendar_id_'+index, eid);
                        formData.append('year_'+index, String(startDate.getFullYear()));
                        formData.append('month_'+index, String(startDate.getMonth() + 1));
                        formData.append('date_'+index, String(startDate.getDate()));
                        formData.append('attendance_id_'+index, existingAttendance?.attendance_id || '');
                        formData.append('user_id_'+index, userIdToUse);
                        formData.append('status_'+index, status);
                        formData.append('adult_count_'+index, String(existingAttendance?.adult_count) || "1");
                        formData.append('child_count_'+index, String(existingAttendance?.child_count) || "0");
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
                    setPendingParticipationStatusCount({}); // 保留中のステータスをクリア
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
                mr:1,
                minWidth: '40px', // 幅を指定
                px: 1 // 左右のパディングを縮小
            }}
        >
            {lang === 'ja-jP' ? '保存' : 'Save'}
        </Button>
    );
   
    function getNextEvent(): CalendarEvent | null {
        const now = new Date();
        let nextEvent: CalendarEvent | null = null;
    
        // Filter out completed events and sort by start date
        // const upcomingEvents = calendarEvents
        //     .filter(event => event.event_status !== 99)
        //     .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
        //本来１個だけど念のため

        const upcomingEvents = calendarEvents
            .filter(event => event.event_status === 20)
            .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

        if (upcomingEvents.length > 0) {
            const earliestEvent = upcomingEvents[0];
            nextEvent = {
                ...earliestEvent,
                attendance: getAttendanceForDayAndEvent(new Date(earliestEvent.start_datetime), attendance, earliestEvent.ID, profile?.userId),
                attendances: getAllAttendanceForDayAndEvent(new Date(earliestEvent.start_datetime), attendance, earliestEvent.ID, users)
            };
            console.log(nextEvent);
        }

        return nextEvent;
    }

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


    function renderRemarkWithLinks(remark: string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = remark.split(urlRegex);
        
        return parts.map((part, index) => {
            // 改行を <br /> に置き換え
            const formattedPart = part.split('\n').map((line, lineIndex) => (
                <>
                    {line.length > 25 ? line.slice(0, 25) + '...' : line}
                    {lineIndex < part.split('\n').length - 1 && <br />}
                </>
            ));
        
            if (urlRegex.test(part)) {
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                        {formattedPart}
                    </a>
                );
            }
            return <span key={index}>{formattedPart}</span>;
        });
    }

    const isUserManager = users.some(user => user[2] === profile?.userId && user[3] === '幹事');
    const nextEvent = getNextEvent();
    return (
        <>
            {(calendarEvents.length > 0 && profile)? (
                <>
                    <Box sx={{display:"flex", flexDirection:'column'}}>
                                <NextEventCard
                                    ProxyReplyButton={ProxyReplyButton}
                                    SaveButton={SaveButton}
                                    expandedEventDetails={expandedEventDetails}
                                    handleParticipationChange={handleParticipationChange}
                                    handleToggleDetails={handleToggleDetails}
                                    isProxyReplyMode={isProxyReplyMode}
                                    isUserManager={isUserManager}
                                    lang={lang}
                                    nextEvent={nextEvent}
                                    pendingParticipationStatus={pendingParticipationStatus}
                                    profile={profile}
                                    proxyReplyUser={proxyReplyUser}
                                    setProxyReplyUser={setProxyReplyUser}
                                    users={users}
                                    />
    
                                {/* カレンダー表示領域 */}
                                <Typography variant="h4" component="div" sx={{ textAlign: 'center', color: '#3f51b5' }}> 
                                {lang === 'ja-JP' ? 'スケジュール' : 'Schedule'}
                                </Typography>

                                {/* カレンダーナビゲーション */}
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
                                {/* カレンダーグリッド */}
                                <CalendarGrid calendar={calendar} daysOfWeek={daysOfWeek} currentDate={currentDate} BALL={BALL} BEER={BEER} LOGO={LOGO} />
                                <Box textAlign="center" m={'3px'} p={'3px'} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="h6" component="div" sx={{ textAlign: 'center', color: '#3f51b5', fontWeight: 'bold', mr:1 }}> 
                                        {lang === 'ja-JP' ? '出席データ' : 'Attendance Data'}
                                    </Typography>
                                    {Object.keys(pendingParticipationStatus).length > 0 && <SaveButton />}
                                </Box>

                                {/* カレンダーナビゲーション */}
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
                                {calendar.map((week, weekIndex) => (
                                    <Box key={weekIndex} >
                                        {week.map((dayData, dayIndex) => (
                                            <>
                                                {typeof dayData === 'object' && dayData.events.length > 0 && dayData.events.map((calendar, index) => (
                                                    <>
                                                    <Box sx={{padding:'8px', marginRight:"8px",marginLeft:"8px",marginTop:"8px", border: '1px solid #eee', backgroundColor: calendar.event_status === 99 ? '#e0e0e0' : '#fffde7', borderRadius: '8px' }}>
                                                        <Box sx={{display: 'flex',mb:1, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', margin:'5px' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <Typography variant="h6" sx={{ color: '#757575', mr:'5px'}}>
                                                                            {new Date(calendar.start_datetime).toLocaleDateString(lang, {
                                                                                month: '2-digit',
                                                                                day: '2-digit',
                                                                                weekday: 'short'
                                                                            }).replace(/-/g, '/')}
                                                                        </Typography>

                                                                        <Typography variant="body2" sx={{ color: '#757575', mr:'5px'}}>
                                                                            {new Date(calendar.start_datetime).toLocaleTimeString(lang, {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                hour12: false
                                                                            })}
                                                                            -
                                                                            {new Date(calendar.end_datetime).toLocaleTimeString(lang, {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                hour12: false
                                                                            })}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography variant="body2" style={{ color: '#757575' }}>
                                                                        {calendar.event_name} @ {calendar.place}
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ color: '#757575' }}>
                                                                        〇 親: {calendar.attendances?.filter(att => att.status === '〇').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                                                                        子: {calendar.attendances?.filter(att => att.status === '〇').reduce((total, att) => total + (att.child_count || 0), 0) || 0}, 
                                                                        △: {calendar.attendances?.filter(att => att.status === '△').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                                                                        ×: {calendar.attendances?.filter(att => att.status === '×').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            <IconButton // トグルボタン
                                                                aria-label="expand"
                                                                size="small"
                                                                onClick={() => handleToggleDetails(calendar.ID)}
                                                            >
                                                                {expandedEventDetails[calendar.ID] ? <ExpandLess /> : <ExpandMore />}
                                                            </IconButton>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', flex:1, gap:2, flexDirection: 'row' }}>

                                                            <FormControl size="small" >
                                                                <InputLabel id="status-select-label">{lang === 'ja-JP' ? '参加可否' : 'Status'}</InputLabel>
                                                                <Select
                                                                    // sx={{minWidth:'100px'}}                                                            
                                                                    labelId="status-select-label"
                                                                    id="status-select"
                                                                    value={calendar.attendance?.status || ''}
                                                                    label={lang === 'ja-JP' ? '参加可否' : 'Status'}
                                                                    disabled={isProxyReplyMode}
                                                                    onChange={(e) => {
                                                                        if(calendar.ID){
                                                                            handleParticipationChange(calendar, e.target.value as '〇' | '△' | '×', profile?.userId, calendar.attendance?.adult_count || 1, calendar.attendance?.child_count || 0);
                                                                            if(calendar.attendance){
                                                                                calendar.attendance.status = e.target.value as '〇' | '△' | '×';
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <MenuItem sx={{width:'100%'}} value={'〇'}>〇</MenuItem>
                                                                    <MenuItem sx={{width:'100%'}} value={'△'}>△</MenuItem>
                                                                    <MenuItem sx={{width:'100%'}} value={'×'}>×</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl size="small" >
                                                                <InputLabel id="adult-count-select-label">{lang === 'ja-JP' ? '大人' : 'Adult'}</InputLabel>
                                                                <Select
                                                                    // sx={{minWidth:'100px'}}
                                                                    labelId="adult-count-select-label"
                                                                    id="adult-count-select"
                                                                    value={calendar.attendance?.adult_count || 1}
                                                                    label={lang === 'ja-JP' ? '大人' : 'Adult'}
                                                                    disabled={isProxyReplyMode}
                                                                    onChange={(e) => {
                                                                        if(calendar.ID){
                                                                            if(calendar.attendance){
                                                                                handleParticipationChange(calendar, calendar.attendance.status as '〇' | '△' | '×', profile?.userId, e.target.value as number, calendar.attendance?.child_count || 0);
                                                                                calendar.attendance.adult_count = e.target.value as number; // Update adultCount
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                {Array.from({ length: 10 }, (_, i) => (
                                                                    <MenuItem key={i} value={i} sx={{width:'100%'}} >{i}</MenuItem>
                                                                ))}
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl size="small" >
                                                                <InputLabel id="child-count-select-label">{lang === 'ja-JP' ? '子供' : 'Child'}</InputLabel>
                                                                <Select
                                                                    // sx={{minWidth:'100px'}}                                                            
                                                                    labelId="child-count-select-label"
                                                                    id="child-count-select"
                                                                    value={calendar.attendance?.child_count || 0}
                                                                    label={lang === 'ja-JP' ? '子供' : 'Child'}
                                                                    disabled={isProxyReplyMode}
                                                                    onChange={(e) => {
                                                                        if(calendar.ID){
                                                                            if(calendar.attendance){
                                                                                handleParticipationChange(calendar, calendar.attendance.status as '〇' | '△' | '×', profile?.userId, calendar.attendance?.adult_count || 1, e.target.value as number);
                                                                                calendar.attendance.child_count = e.target.value as number; // Update childCount
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                {Array.from({ length: 10 }, (_, i) => (
                                                                    <MenuItem key={i} value={i}>{i}</MenuItem>
                                                                ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>


                                                        <Collapse in={expandedEventDetails[calendar.ID]} timeout="auto" unmountOnExit>
                                                            {process.env.NEXT_PUBLIC_APP_TITLE === 'Scout App' ? (
                                                                <Box sx={{ m: '5px' }}>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="primary"
                                                                        onClick={() => router.push(`/calendar/expense?calendarId=${calendar.ID}`)}
                                                                        size='small'
                                                                    >
                                                                        清算
                                                                    </Button>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ m: '5px' }}>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="primary"
                                                                        onClick={() => router.push(`/calendar/input?calendarId=${calendar.ID}`)}
                                                                        size='small'
                                                                    >
                                                                        支払い
                                                                    </Button>
                                                                </Box>
                                                            )}
                                                            <Box sx={{ m: '5px' }}>
                                                                <Typography variant="body1" style={{ color: '#757575', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                                    {renderRemarkWithLinks(calendar.remark)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ m: '5px', display: 'flex', flexDirection: 'column' }}>
                                                                <AttendanceList lang={lang} attendances={calendar.attendances || []} status="〇" />
                                                                <AttendanceList lang={lang} attendances={calendar.attendances || []} status="△" />
                                                                <AttendanceList lang={lang} attendances={calendar.attendances || []} status="×" />
                                                            </Box>
                                                        </Collapse>
                                                    </Box>
                                                    </>
                                                ))}
                                            </>
                                        ))}
                                    </Box>
                                ))}
                                <AddCalendarButton />
                                <Comment componentId='calendar' users={users} user={profile} category='calendar_all' lang={lang} />
                        
                    </Box>

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
                                setPendingParticipationStatusCount({}); // 保留中のステータスをクリア
                            }} color="primary">
                                {lang === 'ja-JP' ? 'リセット' : 'Reset'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            ) : (
                <LoadingSpinner />
            )}
            {showRegistrationDialog && (
                <RegistrationDialog
                    nickname={nickname}
                    onNicknameChange={handleNicknameChange}
                    // onRegister={handleRegister}
                    nicknameError={nicknameError}
                    // disabled={isRegistering}
                    // onClose={() => setShowRegistrationDialog(false)} // ダイアログを閉じるための関数を渡す
                    profile={profile}
                    setNicknameError={setNicknameError}
                    setShowRegistrationDialog={setShowRegistrationDialog}
                    users={users}
                    
                />
            )}
        </>
    );
}