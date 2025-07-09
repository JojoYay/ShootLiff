'use client';
import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Divider,
    Switch,
    FormControlLabel
} from '@mui/material';
import { useLiff } from '../liffProvider';
import { Add, Delete, Edit, CheckCircle, Schedule, PriorityHigh, Assignment } from '@mui/icons-material';
import LoadingSpinner from '../calendar/loadingSpinner';
import LoadingModal from '../components/LoadingModal';
import AvatarIcon from '../stats/avatarIcon';
import { User } from '../types/user';
import { CalendarEvent, Attendance } from '../types/calendar';
import { BALL, LOGO } from '../utils/constants';

interface KanjiTaskData {
    id: string;
    event_id: string;
    act_date: string;
    video: string;
    video_accept: boolean;
    drone_video: string;
    drone_video_accept: boolean;
    drone_prep: string;
    drone_prep_accept: boolean;
    score_mip: string;
    score_mip_accept: boolean;
    captain: string;
    captain_accept: boolean;
    ball: string;
    ball_accept: boolean;
    last_update: string;
    update_user: string;
}

interface Task {
    id: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    taskName: string;
    description: string;
    assignedTo: string;
    assignedToName: string;
    accepted: boolean;
    createdAt: string;
    createdBy: string;
    lastUpdate: string;
    updateUser: string;
}

interface KanjiStats {
    userId: string;
    userName: string;
    totalTasks: number;
    completedTasks: number;
    totalEvents: number;
}

export default function KanjiTask() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [users, setUsers] = useState<string[][]>([]);
    const [kanjiTasks, setKanjiTasks] = useState<string[][]>([]);
    const [profile, setProfile] = useState<User | null>(null);
    const [lang, setLang] = useState<string>('ja-JP');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [kanjiStats, setKanjiStats] = useState<KanjiStats[]>([]);
    const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingMessage, setSavingMessage] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState<boolean>(false);

    // 幹事の仕事の種類（DBカラム名に合わせて調整）
    const kanjiTaskTypes = [
        { value: 'video', label: '地上ビデオ' },
        { value: 'drone_prep', label: 'ドローン' },
        { value: 'score_mip', label: '得点 MIP入力' }
    ];

    // 予備タスク（画面上は非表示、値のみ保持）
    const backupTaskTypes = [
        { value: 'drone_video', label: '予備1' },
        { value: 'captain', label: '予備2' },
        { value: 'ball', label: '予備3' }
    ];
    const { liff } = useLiff();

    useEffect(() => {
        if (liff) {
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    const user: User = {
                        userId: profile.userId,
                        lineName: profile.displayName || '',
                        isKanji: false,
                        displayName: profile.displayName || '',
                        pictureUrl: profile.pictureUrl || '',
                    };
                    setProfile(user);
                    setLang(liff.getLanguage());
                });
            }
        }
    }, [liff]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // データ取得後に未登録イベントをデフォルト状態で保存
        if (events.length > 0 && tasks.length > 0 && !isLoading) {
            const saveUnregisteredEvents = async () => {
                const existingEventIds = kanjiTasks.map(row => row[1]); // event_idの列
                const unregisteredEvents = 
                events.filter(event => !existingEventIds.includes(event.ID));
                
                for (const event of unregisteredEvents) {
                    const defaultData = {
                        id: '', // 新規の場合は空
                        event_id: event.ID,
                        act_date: new Date(event.start_datetime).toISOString().split('T')[0],
                        video: '',
                        video_accept: 'false',
                        drone_video: '',
                        drone_video_accept: 'false',
                        drone_prep: '',
                        drone_prep_accept: 'false',
                        score_mip: '',
                        score_mip_accept: 'false',
                        captain: '',
                        captain_accept: 'false',
                        ball: '',
                        ball_accept: 'false',
                        last_update: new Date().toISOString(),
                        update_user: 'System'
                    };
                    
                    await saveEventData(event.ID, defaultData, true);
                }
            };
            saveUnregisteredEvents();
        }
    }, [events, tasks, isLoading, kanjiTasks]);

    useEffect(() => {
        calculateKanjiStats();
    }, [tasks, users]);

    const fetchData = async () => {
        try {
            let url = process.env.SERVER_URL + `?func=loadCalendar&func=getUsers&func=getAttendance&func=getSheetData&sheetName=Kanji&Type=ActivityReport`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log('Data:', data);
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
                
                // 飲み会以外のイベントのみをフィルタリング（全期間表示）
                const nonDrinkingEvents = processedCalendarEvents.filter(event => 
                    event.event_type !== '飲み会'
                );
                setEvents(nonDrinkingEvents);
                setUsers(data.users.slice(1));
                
                const fetchedAttendance = data.attendance.slice(1).map((item: string[]) => {
                    const calendar_id = item[6];
                    const relatedCalendarEvent = processedCalendarEvents.find(event => event.ID === calendar_id);
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
                setAttendance(fetchedAttendance);
                
                // 幹事タスクデータを取得
                let realTasks: Task[] = [];
                if (data.Kanji) {
                    setKanjiTasks(data.Kanji.slice(1));
                    // 幹事タスクデータからTaskオブジェクトを作成
                    realTasks = data.Kanji.slice(1).map((row: string[], index: number) => {
                        const kanjiData: KanjiTaskData = {
                            id: row[0],
                            event_id: row[1],
                            act_date: row[2],
                            video: row[3],
                            video_accept: Boolean(row[4]),
                            drone_video: row[5],
                            drone_video_accept: Boolean(row[6]),
                            drone_prep: row[7],
                            drone_prep_accept: Boolean(row[8]),
                            score_mip: row[9],
                            score_mip_accept: Boolean(row[10]),
                            captain: row[11],
                            captain_accept: Boolean(row[12]),
                            ball: row[13],
                            ball_accept: Boolean(row[14]),
                            last_update: row[15] || new Date().toISOString(),
                            update_user: row[16] || 'System'
                        };
                        
                        const event = nonDrinkingEvents.find(e => e.ID === kanjiData.event_id);
                        if (!event) return null;
                        
                        const tasks: Task[] = [];
                        const taskMappings = [
                            { name: 'video', assignedTo: kanjiData.video, accepted: kanjiData.video && kanjiData.video !== '' ? Boolean(kanjiData.video_accept) : false },
                            { name: 'drone_video', assignedTo: kanjiData.drone_video, accepted: kanjiData.drone_video && kanjiData.drone_video !== '' ? Boolean(kanjiData.drone_video_accept) : false },
                            { name: 'drone_prep', assignedTo: kanjiData.drone_prep, accepted: kanjiData.drone_prep && kanjiData.drone_prep !== '' ? Boolean(kanjiData.drone_prep_accept) : false },
                            { name: 'score_mip', assignedTo: kanjiData.score_mip, accepted: kanjiData.score_mip && kanjiData.score_mip !== '' ? Boolean(kanjiData.score_mip_accept) : false },
                            { name: 'captain', assignedTo: kanjiData.captain, accepted: kanjiData.captain && kanjiData.captain !== '' ? Boolean(kanjiData.captain_accept) : false },
                            { name: 'ball', assignedTo: kanjiData.ball, accepted: kanjiData.ball && kanjiData.ball !== '' ? Boolean(kanjiData.ball_accept) : false }
                        ];
                        
                        taskMappings.forEach((taskMapping, taskIndex) => {
                            const assignedUser = taskMapping.assignedTo && taskMapping.assignedTo !== '' 
                                ? data.users.slice(1).find((u: string[]) => u[2] === taskMapping.assignedTo)
                                : null;
                            
                                                            tasks.push({
                                    id: `${kanjiData.event_id}_${taskIndex}`,
                                    eventId: kanjiData.event_id,
                                    eventName: event.event_name,
                                    eventDate: event.start_datetime,
                                    taskName: taskMapping.name,
                                    description: `${taskMapping.name}を担当`,
                                    assignedTo: taskMapping.assignedTo || '',
                                    assignedToName: assignedUser ? assignedUser[1] : '',
                                    accepted: taskMapping.accepted,
                                    createdAt: new Date().toISOString().split('T')[0],
                                    createdBy: profile?.userId || '',
                                    lastUpdate: new Date().toISOString(),
                                    updateUser: 'System'
                                });
                        });
                        
                        return tasks;
                    }).filter(Boolean).flat();
                    console.log('realTasks:', realTasks);
                }

                // タスクが存在しないイベントに対してブランクのタスクデータを作成
                const existingEventIds = data.Kanji ? data.Kanji.slice(1).map((row: string[]) => row[1]) : [];
                const missingTaskEvents = nonDrinkingEvents.filter(event => !existingEventIds.includes(event.ID));
                
                const blankTasks: Task[] = missingTaskEvents.flatMap(event => {
                    // メインタスクと予備タスクを結合
                    const allTaskTypes = [...kanjiTaskTypes, ...backupTaskTypes];
                    return allTaskTypes.map((taskType, taskIndex) => ({
                        id: `${event.ID}_${taskIndex}`,
                        eventId: event.ID,
                        eventName: event.event_name,
                        eventDate: event.start_datetime,
                        taskName: taskType.value,
                        description: `${taskType.value}を担当`,
                        assignedTo: '',
                        assignedToName: '',
                        accepted: false,
                        createdAt: new Date().toISOString().split('T')[0],
                        createdBy: profile?.userId || '',
                        lastUpdate: new Date().toISOString(),
                        updateUser: 'System'
                    }));
                });

                // 既存のタスクとブランクタスクを結合
                const allTasks = [...realTasks, ...blankTasks];
                setTasks(allTasks);
            setIsLoading(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsLoading(false);
        }
    };

    const calculateKanjiStats = () => {
        const kanjiUsers = users.filter(user => user[3] === '幹事');
        const stats: KanjiStats[] = kanjiUsers.map(user => {
            const userTasks = tasks.filter(task => task.assignedTo === user[2] && task.accepted);
            
            // 各幹事の実際の参加数（〇のデータのみ）を計算
            const userAttendance = attendance.filter(att => 
                att.user_id === user[2] && 
                att.status === '〇' &&
                events.some(event => event.ID === att.calendar_id) // イベントIDが存在するもののみ
            );
            
            return {
                userId: user[2],
                userName: user[1],
                totalTasks: userTasks.length,
                completedTasks: userTasks.length,
                totalEvents: userAttendance.length
            };
        }).filter(stat => stat.completedTasks > 0); // 完了タスクが0の場合は表示しない
        setKanjiStats(stats);
    };

    const getEventAttendees = (eventId: string) => {
        const eventDate = new Date(events.find(e => e.ID === eventId)?.start_datetime || '');
        const eventAttendances = attendance.filter(att => 
            att.calendar_id === eventId &&
            parseInt(att.year) === eventDate.getFullYear() &&
            parseInt(att.month) === (eventDate.getMonth() + 1) &&
            parseInt(att.date) === eventDate.getDate() &&
            att.status === '〇'
        );
        
        // 幹事のみをフィルタリング
        return eventAttendances.filter(att => {
            const user = users.find(u => u[2] === att.user_id);
            return user && user[3] === '幹事';
        });
    };



    const handleAcceptToggle = (taskId: string) => {
            setTasks(prevTasks => 
                prevTasks.map(task => 
                task.id === taskId 
                    ? { 
                        ...task, 
                        accepted: !task.accepted,
                        lastUpdate: new Date().toISOString(),
                        updateUser: profile?.displayName || profile?.userId || 'Unknown'
                    }
                    : task
                )
            );
    };

    const handleAssigneeChange = (taskId: string, newAssigneeId: string) => {
        const newAssignee = users.find(u => u[2] === newAssigneeId);
        setTasks(prevTasks => 
            prevTasks.map(task => 
                task.id === taskId 
                    ? { 
                        ...task, 
                        assignedTo: newAssigneeId,
                        assignedToName: newAssignee ? newAssignee[1] : newAssigneeId,
                        accepted: false, // 担当者変更時はAcceptをfalseにリセット
                        lastUpdate: new Date().toISOString(),
                        updateUser: profile?.displayName || profile?.userId || 'Unknown'
                    }
                    : task
            )
        );
    };

    const handleNewAssignee = (eventId: string, taskType: string, newAssigneeId: string) => {
        if (!newAssigneeId) return;
        
        const newAssignee = users.find(u => u[2] === newAssigneeId);
        const event = events.find(e => e.ID === eventId);
        if (!event || !newAssignee) return;

        const newTask: Task = {
            id: `${eventId}_${taskType}`,
            eventId: eventId,
            eventName: event.event_name,
            eventDate: event.start_datetime,
            taskName: taskType,
            description: `${taskType}を担当`,
            assignedTo: newAssigneeId,
            assignedToName: newAssignee[1],
            accepted: false,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: profile?.userId || '',
            lastUpdate: new Date().toISOString(),
            updateUser: profile?.displayName || profile?.userId || 'Unknown'
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    };



    const saveEventData = async (eventId: string, data: any, isInitial: boolean = false) => {
        try {
            setIsSaving(true);
            setSavingMessage(isInitial ? '初期データを作成中...' : '保存中...');
            
            const url = process.env.SERVER_URL;
            if (!url) return;

            const formData = new FormData();
            formData.append('func', 'saveSheetData');
            formData.append('sheetName', 'Kanji');
            formData.append('type', 'ActivityReport');
            formData.append('data', JSON.stringify(data));

            for (const pair of Array.from(formData.entries())) {
                console.log(pair[0] + ', ' + pair[1]);
            }

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                console.log(`Event ${eventId} saved successfully`);
            } else {
                console.error(`Failed to save event ${eventId}`);
            }
        } catch (error) {
            console.error('Error saving event data:', error);
        } finally {
            setIsSaving(false);
            setSavingMessage('');
        }
    };

    const handleAIAssignment = (event: CalendarEvent) => {
        setIsAssigning(true);
        
        // 当日出席幹事を取得
        const attendees = getEventAttendees(event.ID);
        const availableKanji = attendees.map(att => {
            const user = users.find(u => u[2] === att.user_id);
            return user ? { userId: user[2], userName: user[1], userPic: user[4] } : null;
        }).filter((kanji): kanji is { userId: string; userName: string, userPic: string } => kanji !== null);

        if (availableKanji.length === 0) {
            setIsAssigning(false);
            return;
        }

        // 現在のタスク状態を取得
        const currentTasks = tasks.filter(task => task.eventId === event.ID);
        
        // Acceptされたタスクは変更しない
        const acceptedTasks = currentTasks.filter(task => task.accepted);
        const acceptedUserIds = acceptedTasks.map(task => task.assignedTo);
        
        // 変更可能なタスクを取得
        const changeableTasks = currentTasks.filter(task => !task.accepted);
        
        // 利用可能な幹事（Acceptされたタスクにアサインされていない人）
        const availableKanjiForAssignment = availableKanji.filter(kanji => 
            !acceptedUserIds.includes(kanji.userId)
        );

        if (availableKanjiForAssignment.length === 0) {
            setIsAssigning(false);
            return;
        }

        // 各幹事の現在のタスク数をカウント
        const taskCounts = new Map<string, number>();
        availableKanjiForAssignment.forEach(kanji => {
            taskCounts.set(kanji.userId, 0);
        });

        // 既存のタスク数をカウント
        currentTasks.forEach(task => {
            if (taskCounts.has(task.assignedTo)) {
                taskCounts.set(task.assignedTo, taskCounts.get(task.assignedTo)! + 1);
            }
        });

        // タスクの優先順位を設定（地上ビデオとドローン・得点入力は別の人）
        const priorityTasks = ['video', 'drone_prep', 'score_mip'];
        const otherTasks = ['drone_video', 'captain', 'ball'];

        setTasks(prevTasks => {
            const updatedTasks = [...prevTasks];
            
            // 優先タスクを先にアサイン
            priorityTasks.forEach(taskName => {
                const task = updatedTasks.find(t => t.eventId === event.ID && t.taskName === taskName && !t.accepted);
                if (task) {
                    // 最もタスク数が少ない人を選択
                    const selectedKanji = availableKanjiForAssignment.reduce((min, current) => 
                        taskCounts.get(current.userId)! < taskCounts.get(min.userId)! ? current : min
                    );
                    
                    task.assignedTo = selectedKanji.userId;
                    task.assignedToName = selectedKanji.userName;
                    task.lastUpdate = new Date().toISOString();
                    task.updateUser = 'AI Assignment';
                    taskCounts.set(selectedKanji.userId, taskCounts.get(selectedKanji.userId)! + 1);
                }
            });

            // その他のタスクをアサイン
            otherTasks.forEach(taskName => {
                const task = updatedTasks.find(t => t.eventId === event.ID && t.taskName === taskName && !t.accepted);
                if (task) {
                    // 最もタスク数が少ない人を選択
                    const selectedKanji = availableKanjiForAssignment.reduce((min, current) => 
                        taskCounts.get(current.userId)! < taskCounts.get(min.userId)! ? current : min
                    );
                    
                    task.assignedTo = selectedKanji.userId;
                    task.assignedToName = selectedKanji.userName;
                    task.lastUpdate = new Date().toISOString();
                    task.updateUser = 'AI Assignment';
                    taskCounts.set(selectedKanji.userId, taskCounts.get(selectedKanji.userId)! + 1);
                }
            });

            return updatedTasks;
        });

        setTimeout(() => setIsAssigning(false), 1000);
    };

    const handleSaveEvent = async (event: CalendarEvent) => {
        const eventTasks = tasks.filter(task => task.eventId === event.ID);
        const existingKanjiData = kanjiTasks.find(row => row[1] === event.ID);
        
        // タスクデータをKanjiシートの形式に変換
        const taskData = {
            video: '',
            video_accept: 'false',
            drone_video: '',
            drone_video_accept: 'false',
            drone_prep: '',
            drone_prep_accept: 'false',
            score_mip: '',
            score_mip_accept: 'false',
            captain: '',
            captain_accept: 'false',
            ball: '',
            ball_accept: 'false'
        };

        eventTasks.forEach(task => {
            switch (task.taskName) {
                case 'video':
                    taskData.video = task.assignedTo;
                    taskData.video_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'drone_video':
                    taskData.drone_video = task.assignedTo;
                    taskData.drone_video_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'drone_prep':
                    taskData.drone_prep = task.assignedTo;
                    taskData.drone_prep_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'score_mip':
                    taskData.score_mip = task.assignedTo;
                    taskData.score_mip_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'captain':
                    taskData.captain = task.assignedTo;
                    taskData.captain_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'ball':
                    taskData.ball = task.assignedTo;
                    taskData.ball_accept = task.accepted ? 'true' : 'false';
                    break;
            }
        });

        const data = {
            id: existingKanjiData ? existingKanjiData[0] : '', // 既存データの場合はID、新規の場合は空
            event_id: event.ID,
            act_date: new Date(event.start_datetime).toISOString().split('T')[0],
            video: taskData.video,
            video_accept: taskData.video_accept,
            drone_video: taskData.drone_video,
            drone_video_accept: taskData.drone_video_accept,
            drone_prep: taskData.drone_prep,
            drone_prep_accept: taskData.drone_prep_accept,
            score_mip: taskData.score_mip,
            score_mip_accept: taskData.score_mip_accept,
            captain: taskData.captain,
            captain_accept: taskData.captain_accept,
            ball: taskData.ball,
            ball_accept: taskData.ball_accept,
            last_update: new Date().toISOString(),
            update_user: profile?.displayName || profile?.userId || 'Unknown'
        };

        await saveEventData(event.ID, data, false);
    };

    const getLatestUpdateInfo = (eventId: string) => {
        const eventTasks = tasks.filter(task => task.eventId === eventId);
        if (eventTasks.length === 0) return null;
        
        // 最新の更新を取得
        const latestTask = eventTasks.reduce((latest, current) => {
            return new Date(current.lastUpdate) > new Date(latest.lastUpdate) ? current : latest;
        });
        
        return {
            lastUpdate: latestTask.lastUpdate,
            updateUser: latestTask.updateUser
        };
    };

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'フットサル': return <img src={BALL} alt="フットサル" width={24} height={24} />;
            case 'いつもの': return <img src={LOGO} alt="いつもの" width={24} height={24} />;
            default: return <Assignment />;
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <LoadingModal open={isSaving} message={savingMessage} />
            <Box sx={{ display: "flex", flexDirection: 'column', p: 2 }}>
                <Typography variant="h4" component="div" sx={{ textAlign: 'center', color: '#3f51b5', mb: 3 }}> 
                    {lang === 'ja-JP' ? '幹事タスク管理' : 'Kanji Task Management'}
                </Typography>

                                {/* イベント一覧 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#757575' }}>
                        {lang === 'ja-JP' ? 'イベント一覧' : 'Event List'}
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showPastEvents}
                                onChange={(e) => setShowPastEvents(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={lang === 'ja-JP' ? '過去のイベントを表示' : 'Show Past Events'}
                    />
                </Box>

                {events.filter(event => showPastEvents || event.event_status !== 99).map((event) => {
                    const eventTasks = tasks.filter(task => task.eventId === event.ID);
                    const attendees = getEventAttendees(event.ID);
                    const availableKanji = attendees.map(att => {
                        const user = users.find(u => u[2] === att.user_id);
                        return user ? { userId: user[2], userName: user[1], userPic: user[4] } : null;
                    }).filter((kanji): kanji is { userId: string; userName: string, userPic: string } => kanji !== null);

                    return (
                        <Paper key={event.ID} elevation={2} sx={{ mb: 2 }}>
                            <Box sx={{ p: 2 }}>
                                {/* 1行目: 日付とイベント名、保存ボタン */}
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="h6" sx={{ color: '#757575', fontWeight: 'bold' }}>
                                                {new Date(event.start_datetime).toLocaleString('ja-JP', {
                                                    timeZone: 'Asia/Singapore',
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    weekday: 'short'
                                                })}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {event.event_name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleAIAssignment(event)}
                                                disabled={isAssigning}
                                                sx={{ minWidth: 'auto', px: 2 }}
                                            >
                                                {isAssigning ? (lang === 'ja-JP' ? '配置中...' : 'Assigning...') : (lang === 'ja-JP' ? 'AI配置' : 'AI Assign')}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleSaveEvent(event)}
                                                sx={{ minWidth: 'auto', px: 2 }}
                                            >
                                                {lang === 'ja-JP' ? '保存' : 'Save'}
                                            </Button>
                                        </Box>
                                    </Box>

                                {/* タスクテーブル */}
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#757575' }}>
                                            {lang === 'ja-JP' ? 'タスク' : 'Task'}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#757575' }}>
                                            {lang === 'ja-JP' ? '担当者' : 'Assigned To'}
                                                </Typography>
                                    </Box>
                                    {kanjiTaskTypes.map((taskType) => {
                                        const existingTask = tasks.find(task => 
                                            task.eventId === event.ID && task.taskName === taskType.value
                                        );
                                        
                                        // 当日出席幹事に加えて、タスクにアサインされている人も含める
                                        const assignedUsers = existingTask ? [existingTask.assignedTo] : [];
                                        const allAvailableKanji = [...availableKanji];
                                        
                                        // アサインされているが出席していない人を追加
                                        assignedUsers.forEach(userId => {
                                            if (userId && !availableKanji.find(k => k.userId === userId)) {
                                                const user = users.find(u => u[2] === userId);
                                                if (user) {
                                                    allAvailableKanji.push({ userId: user[2], userName: user[1], userPic: user[4] });
                                                }
                                            }
                                        });
                                        
                                        return (
                                            <Box key={taskType.value} sx={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: '1fr 1fr', 
                                                gap: 1, 
                                                p: 1, 
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                mb: 0.5
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="body2">
                                                        {taskType.label}
                                                </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                    <Select
                                                                value={existingTask?.assignedTo || ""}
                                                                onChange={(e) => {
                                                                    if (existingTask) {
                                                                        handleAssigneeChange(existingTask.id, e.target.value);
                                                                    } else {
                                                                        handleNewAssignee(event.ID, taskType.value, e.target.value);
                                                                    }
                                                                }}
                                                        size="small"
                                                                displayEmpty
                                                                sx={{
                                                                    '& .MuiSelect-select': {
                                                                        backgroundColor: existingTask?.assignedTo && 
                                                                            !availableKanji.find(k => k.userId === existingTask.assignedTo) 
                                                                            ? '#ffebee' : 'inherit'
                                                                    }
                                                                }}
                                                            >
                                                                <MenuItem value="" disabled>
                                                                    {lang === 'ja-JP' ? 'アサイン' : 'Assign'}
                                                                </MenuItem>
                                                                {allAvailableKanji.map((kanji) => (
                                                                    <MenuItem 
                                                                        key={kanji.userId} 
                                                                        value={kanji.userId}
                                                                        sx={{
                                                                            backgroundColor: !availableKanji.find(k => k.userId === kanji.userId) 
                                                                                ? '#ffebee' : 'inherit'
                                                                        }}
                                                                    >
                                                                        {kanji.userName}
                                                                        {/* {!availableKanji.find(k => k.userId === kanji.userId) && 
                                                                            ` (未参加)`
                                                                        } */}
                                                                    </MenuItem>
                                                                ))}
                                                    </Select>
                                                </FormControl>
                                                        {existingTask && (
                                                            <Button
                                                                variant={existingTask.accepted ? "contained" : "outlined"}
                                                                color={existingTask.accepted ? "success" : "primary"}
                                                    size="small"
                                                                onClick={() => handleAcceptToggle(existingTask.id)}
                                                                sx={{ minWidth: 'auto', px: 1 }}
                                                            >
                                                                {existingTask.accepted ? (lang === 'ja-JP' ? '受諾済み' : 'Accepted') : (lang === 'ja-JP' ? '受諾' : 'Accept')}
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>

                                {/* 更新情報 */}
                                {(() => {
                                    const updateInfo = getLatestUpdateInfo(event.ID);
                                    return updateInfo && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.75rem' }}>
                                                {lang === 'ja-JP' ? '最終更新' : 'Last Update'}: {new Date(updateInfo.lastUpdate).toLocaleString('ja-JP', {
                                                    timeZone: 'Asia/Singapore',
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })} by {updateInfo.updateUser}
                                            </Typography>
                                        </Box>
                                    );
                                })()}

                                {/* 当日出席幹事 */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#757575' }}>
                                        {lang === 'ja-JP' ? '当日出席幹事' : 'Attending Kanji'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {availableKanji.map((kanji) => (
                                            <Chip
                                                key={kanji.userId}
                                                avatar={
                                                    <AvatarIcon 
                                                        picUrl={kanji.userPic}
                                                        name={kanji.userName}
                                                        width={24}
                                                        height={24}
                                                        showTooltip={false}
                                                    />
                                                }
                                                label={kanji.userName}
                                                variant="outlined"
                                                size="small"
                                            />
                                        ))}
                                        {availableKanji.length === 0 && (
                                            <Typography variant="body2" sx={{ color: '#f44336' }}>
                                                {lang === 'ja-JP' ? '出席予定の幹事がいません' : 'No attending kanji'}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    );
                })}

                {/* 幹事統計 */}
                <Paper elevation={2} sx={{ mb: 3, p: 2, mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#757575' }}>
                        {lang === 'ja-JP' ? '幹事統計' : 'Kanji Statistics'}
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>
                                        {lang === 'ja-JP' ? '幹事' : 'Kanji'}
                                    </th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {lang === 'ja-JP' ? '完了タスク数/参加数' : 'Completed/Total'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {kanjiStats.map((stat) => (
                                    <tr key={stat.userId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AvatarIcon 
                                                name={stat.userName}
                                                width={24}
                                                height={24}
                                                showTooltip={true}
                                            />
                                            <span>{stat.userName}</span>
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            {stat.completedTasks}/{stat.totalEvents}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </Paper>
            </Box>
        </>
    );
} 