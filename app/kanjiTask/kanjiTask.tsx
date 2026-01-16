'use client';
import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    IconButton,
    FormControl,
    Select,
    MenuItem,
    Chip,
    Switch,
    FormControlLabel
} from '@mui/material';
import { useLiff } from '../liffProvider';
import { CheckCircle, Assignment, ViewModule, ViewList, ArrowUpward, ArrowDownward, ExpandMore, ExpandLess } from '@mui/icons-material';
import LoadingSpinner from '../calendar/loadingSpinner';
import LoadingModal from '../components/LoadingModal';
import AvatarIcon from '../stats/avatarIcon';
import { User, JsonUser } from '../types/user';
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
    userPic?: string;
    totalTasks: number;
    completedTasks: number;
    totalEvents: number;
    videoTasks: number;
    droneTasks: number;
    mipTasks: number;
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
    const [viewMode, setViewMode] = useState<'card' | 'grid'>('grid');
    const [rotationOrder, setRotationOrder] = useState<string[]>([]); // 幹事のローテーション順
    const [excludedKanji, setExcludedKanji] = useState<Set<string>>(new Set()); // ローテーションから除外された幹事
    const [showSettings, setShowSettings] = useState<boolean>(false);

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
    const { liff, isInitialized } = useLiff();

    useEffect(() => {
        if (isInitialized && liff && liff.isLoggedIn()) {
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
    }, [liff, isInitialized]);

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

    useEffect(() => {
        // 幹事のローテーション順を初期化（除外された幹事は除く）
        if (users.length > 0 && rotationOrder.length === 0) {
            const kanjiUsers = users
                .filter(user => user[3] === '幹事' && user[1] !== '忍' && !excludedKanji.has(user[2]))
                .map(user => user[2]);
            setRotationOrder(kanjiUsers);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users, excludedKanji]);

    const fetchData = async () => {
        try {
            let url = process.env.NEXT_PUBLIC_SERVER_URL + `?func=loadCalendar&func=getUsers&func=getAttendance&func=getSheetData&sheetName=Kanji&Type=ActivityReport`;
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
                
                // jsonUsersをstring[][]形式に変換（既存コードとの互換性のため）
                const jsonUsers = (data.jsonUsers as JsonUser[] || []);
                const convertedUsers = jsonUsers.map((user: JsonUser) => [
                    user["LINE ID"] || '', // [0] - ID（使用されていないが互換性のため）
                    user["伝助上の名前"] || '', // [1] - 名前
                    user["LINE ID"] || '', // [2] - LINE ID
                    user["幹事フラグ"] || '', // [3] - 幹事フラグ
                    user["Picture"] || '', // [4] - 画像URL
                ]);
                setUsers(convertedUsers);
                
                // jsonAttendanceを使用
                const fetchedAttendance = (data.jsonAttendance || []).map((item: any) => {
                    const calendar_id = item.calendar_id;
                    const relatedCalendarEvent = processedCalendarEvents.find(event => event.ID === calendar_id);
                    return {
                        attendance_id: String(item.attendance_id || ''),
                        user_id: item.user_id || '',
                        year: String(item.year || ''),
                        month: String(item.month || ''),
                        date: String(item.date || ''),
                        status: item.status || '',
                        calendar_id: item.calendar_id || '',
                        calendar: relatedCalendarEvent || null,
                        adult_count: typeof item.adult_count === 'number' ? item.adult_count : (item.adult_count === '' || item.adult_count === null || item.adult_count === undefined ? 1 : Number(item.adult_count) || 1),
                        child_count: typeof item.child_count === 'number' ? item.child_count : (item.child_count === '' || item.child_count === null || item.child_count === undefined ? 0 : Number(item.child_count) || 0),
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
                                ? convertedUsers.find((u: string[]) => u[2] === taskMapping.assignedTo)
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
                console.log('allTasks:', allTasks);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsLoading(false);
        }
    };

    const calculateKanjiStats = () => {
        const kanjiUsers = users.filter(user => user[3] === '幹事' && user[1] !== '忍');
        
        // 表示されているタスクタイプ
        const displayedTaskTypes = kanjiTaskTypes.map(t => t.value);
        
        // 全てのタスクがアサインされているイベントを取得
        const fullyAssignedEvents = events.filter(event => {
            const eventTasks = tasks.filter(task => task.eventId === event.ID);
            const displayedTasks = eventTasks.filter(task => displayedTaskTypes.includes(task.taskName));
            
            // 全ての表示タスクがアサインされているかチェック
            return displayedTasks.length === displayedTaskTypes.length && 
                   displayedTasks.every(task => task.assignedTo && task.assignedTo !== '');
        });
        
        const stats: KanjiStats[] = kanjiUsers.map(user => {
            // Acceptしているかしていないかは関係なく、アサインされているタスクをカウント
            const userTasks = tasks.filter(task => 
                task.assignedTo === user[2] && 
                displayedTaskTypes.includes(task.taskName)
            );
            
            // 各種目ごとにカウント
            const videoTasks = userTasks.filter(task => task.taskName === 'video').length;
            const droneTasks = userTasks.filter(task => task.taskName === 'drone_prep').length;
            const mipTasks = userTasks.filter(task => task.taskName === 'score_mip').length;
            
            // 全てのタスクがアサインされているイベントで、そのユーザーが参加している（〇）イベントをカウント
            const userAttendance = attendance.filter(att => 
                att.user_id === user[2] && 
                att.status === '〇' &&
                fullyAssignedEvents.some(event => event.ID === att.calendar_id) // 全てのタスクがアサインされているイベントのみ
            );
            
            return {
                userId: user[2],
                userName: user[1],
                userPic: user[4],
                totalTasks: userTasks.length,
                completedTasks: userTasks.length,
                totalEvents: userAttendance.length,
                videoTasks: videoTasks,
                droneTasks: droneTasks,
                mipTasks: mipTasks
            };
        }).filter(stat => stat.completedTasks > 0); // 完了タスクが0の場合は表示しない
        console.log('kanjiStats:', stats);
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
        // 空文字列の場合はタスクを削除
        if (!newAssigneeId) {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            return;
        }
        
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
            
            const url = process.env.NEXT_PUBLIC_SERVER_URL;
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

    const handleBulkAIAssignment = () => {
        setIsAssigning(true);
        
        // 現在の日付を取得（時刻を00:00:00に設定）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 表示されているイベントを取得（過去日付のイベントは除外）
        const visibleEvents = events.filter(event => {
            const eventDate = new Date(event.start_datetime);
            eventDate.setHours(0, 0, 0, 0);
            const isPastEvent = eventDate < today;
            
            // 過去日付のイベントは除外
            if (isPastEvent) return false;
            
            // その他のフィルタ条件
            return showPastEvents || event.event_status !== 99;
        });
        
        if (rotationOrder.length === 0) {
            setIsAssigning(false);
            return;
        }
        
        // ローテーション順に従ってアサイン（未アサインのタスクのみ、参加の是非を考慮）
        setTasks(prevTasks => {
            const updatedTasks = [...prevTasks];
            let rotationIndex = 0; // ローテーション用のインデックス
            
            // 各幹事のタスク数をカウント（均等化のため）
            const taskCounts = new Map<string, number>();
            rotationOrder.forEach(userId => {
                taskCounts.set(userId, 0);
            });
            
            visibleEvents.forEach(event => {
                // このイベントの参加予定幹事を取得
                const attendees = getEventAttendees(event.ID);
                const attendeeIds = new Set(attendees.map(att => att.user_id));
                
                // 参加予定の幹事と参加予定外の幹事を分ける
                const attendingKanji = rotationOrder.filter(userId => attendeeIds.has(userId));
                const nonAttendingKanji = rotationOrder.filter(userId => !attendeeIds.has(userId));
                
                // このイベントの未アサインのタスクを取得
                const displayedTaskTypes = ['video', 'drone_prep', 'score_mip'];
                const unassignedTasks = displayedTaskTypes.map(taskType => {
                    const task = updatedTasks.find(t => 
                        t.eventId === event.ID && 
                        t.taskName === taskType
                    );
                    return { task, taskType };
                }).filter(item => {
                    // 未アサインのタスクのみ
                    return !item.task || !item.task.assignedTo || item.task.assignedTo === '';
                });
                
                // 各未アサインタスクにローテーションでアサイン
                unassignedTasks.forEach(({ task, taskType }) => {
                    // 使用する候補リストを決定（参加予定を優先）
                    let candidateList: string[] = [];
                    if (attendingKanji.length > 0) {
                        // 参加予定の幹事がいる場合、参加予定の幹事を優先
                        // ローテーション順を保持しつつ、参加予定の幹事を先に配置
                        candidateList = rotationOrder.filter(id => attendingKanji.includes(id));
                        // 参加予定外の幹事も追加（不足する場合に備えて）
                        candidateList = [...candidateList, ...rotationOrder.filter(id => nonAttendingKanji.includes(id))];
                    } else {
                        // 参加予定の幹事がいない場合、全員から選択（ローテーション順を維持）
                        candidateList = rotationOrder;
                    }
                    
                    // ローテーション順に従って、タスク数が最も少ない候補を選択
                    // 参加予定の幹事を優先しつつ、タスク数の均等化も考慮
                    let selectedKanji: string | null = null;
                    let minTaskCount = Infinity;
                    
                    // まず参加予定の幹事から、タスク数が最も少ない人を探す
                    for (let i = 0; i < candidateList.length; i++) {
                        const candidateId = candidateList[(rotationIndex + i) % candidateList.length];
                        const user = users.find(u => u[2] === candidateId);
                        if (!user) continue;
                        
                        const isAttending = attendeeIds.has(candidateId);
                        const taskCount = taskCounts.get(candidateId) || 0;
                        
                        // 参加予定の幹事を優先し、タスク数が少ない人を選択
                        if (isAttending && (selectedKanji === null || attendeeIds.has(selectedKanji) === false || taskCount < minTaskCount)) {
                            selectedKanji = candidateId;
                            minTaskCount = taskCount;
                        } else if (!selectedKanji && !isAttending && taskCount < minTaskCount) {
                            // 参加予定の幹事がいない場合のみ、参加予定外の幹事を選択
                            selectedKanji = candidateId;
                            minTaskCount = taskCount;
                        }
                    }
                    
                    // 参加予定の幹事がいる場合は、必ず参加予定の幹事から選択
                    if (attendingKanji.length > 0 && selectedKanji && !attendeeIds.has(selectedKanji)) {
                        // 参加予定の幹事から、タスク数が最も少ない人を選択
                        const attendingCandidates = attendingKanji.map(id => ({
                            id,
                            count: taskCounts.get(id) || 0
                        })).sort((a, b) => a.count - b.count);
                        
                        if (attendingCandidates.length > 0) {
                            selectedKanji = attendingCandidates[0].id;
                        }
                    }
                    
                    if (selectedKanji) {
                        const user = users.find(u => u[2] === selectedKanji);
                        if (user) {
                            if (!task) {
                                // 新規タスクを作成
                                const newTask: Task = {
                                    id: `${event.ID}_${taskType}`,
                                    eventId: event.ID,
                                    eventName: event.event_name,
                                    eventDate: event.start_datetime,
                                    taskName: taskType,
                                    description: `${taskType}を担当`,
                                    assignedTo: selectedKanji,
                                    assignedToName: user[1],
                                    accepted: false,
                                    createdAt: new Date().toISOString().split('T')[0],
                                    createdBy: profile?.userId || '',
                                    lastUpdate: new Date().toISOString(),
                                    updateUser: 'AI Assignment'
                                };
                                updatedTasks.push(newTask);
                            } else {
                                // 既存タスクを更新
                                task.assignedTo = selectedKanji;
                                task.assignedToName = user[1];
                                task.accepted = false;
                                task.lastUpdate = new Date().toISOString();
                                task.updateUser = 'AI Assignment';
                            }
                            
                            // タスク数を更新
                            taskCounts.set(selectedKanji, (taskCounts.get(selectedKanji) || 0) + 1);
                            rotationIndex++;
                        }
                    }
                });
            });
            
            return updatedTasks;
        });
        
        setTimeout(() => setIsAssigning(false), 1000);
    };

    const handleBulkSave = async () => {
        setIsSaving(true);
        setSavingMessage('一括保存中...');
        
        try {
            // 現在の日付を取得（時刻を00:00:00に設定）
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 表示されているイベントを取得（過去日付のイベントは除外）
            const visibleEvents = events.filter(event => {
                const eventDate = new Date(event.start_datetime);
                eventDate.setHours(0, 0, 0, 0);
                const isPastEvent = eventDate < today;
                
                // 過去日付のイベントは除外
                if (isPastEvent) return false;
                
                // その他のフィルタ条件
                return showPastEvents || event.event_status !== 99;
            });
            
            // 変更があるイベントのみを保存
            const eventsToSave = visibleEvents.filter(event => hasChanges(event.ID));
            
            if (eventsToSave.length === 0) {
                setIsSaving(false);
                setSavingMessage('');
                return;
            }
            
            // 各イベントを順番に保存
            for (const event of eventsToSave) {
                await handleSaveEvent(event);
            }
            
            setIsSaving(false);
            setSavingMessage('');
        } catch (error) {
            console.error('Error in bulk save:', error);
            setIsSaving(false);
            setSavingMessage('');
        }
    };

    const hasAnyChanges = (): boolean => {
        // データがまだロードされていない場合は変更なし
        if (isLoading) {
            return false;
        }
        
        // 現在の日付を取得（時刻を00:00:00に設定）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 表示されているイベントを取得（過去日付のイベントは除外）
        const visibleEvents = events.filter(event => {
            const eventDate = new Date(event.start_datetime);
            eventDate.setHours(0, 0, 0, 0);
            const isPastEvent = eventDate < today;
            
            // 過去日付のイベントは除外
            if (isPastEvent) return false;
            
            // その他のフィルタ条件
            return showPastEvents || event.event_status !== 99;
        });
        
        // 変更があるイベントが1つでもあるかチェック
        return visibleEvents.some(event => hasChanges(event.ID));
    };

    const moveKanjiUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...rotationOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setRotationOrder(newOrder);
    };

    const moveKanjiDown = (index: number) => {
        if (index === rotationOrder.length - 1) return;
        const newOrder = [...rotationOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setRotationOrder(newOrder);
    };

    const toggleKanjiExclusion = (userId: string) => {
        setExcludedKanji(prev => {
            const newExcluded = new Set(prev);
            if (newExcluded.has(userId)) {
                // 除外を解除する場合、ローテーションに追加
                newExcluded.delete(userId);
                setRotationOrder(prevOrder => {
                    // 既にローテーションに含まれている場合は追加しない
                    if (!prevOrder.includes(userId)) {
                        return [...prevOrder, userId];
                    }
                    return prevOrder;
                });
            } else {
                // 除外する場合、ローテーションから削除
                newExcluded.add(userId);
                setRotationOrder(prevOrder => prevOrder.filter(id => id !== userId));
            }
            return newExcluded;
        });
    };

    const hasChanges = (eventId: string): boolean => {
        // データがまだロードされていない場合は変更なし
        if (isLoading) {
            return false;
        }
        
        const eventTasks = tasks.filter(task => task.eventId === eventId);
        const existingKanjiData = kanjiTasks.find(row => row[1] === eventId);
        
        // 既存データがない場合（新規イベント）、全てのタスクが空であれば変更なし
        if (!existingKanjiData) {
            // 表示されているタスク（kanjiTaskTypes）のみをチェック
            const displayedTaskNames = kanjiTaskTypes.map(t => t.value);
            const displayedTasks = eventTasks.filter(task => displayedTaskNames.includes(task.taskName));
            return displayedTasks.some(task => task.assignedTo !== '' || task.accepted);
        }
        
        // 現在のタスク状態を取得
        const currentTaskData = {
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
                    currentTaskData.video = task.assignedTo || '';
                    currentTaskData.video_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'drone_video':
                    currentTaskData.drone_video = task.assignedTo || '';
                    currentTaskData.drone_video_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'drone_prep':
                    currentTaskData.drone_prep = task.assignedTo || '';
                    currentTaskData.drone_prep_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'score_mip':
                    currentTaskData.score_mip = task.assignedTo || '';
                    currentTaskData.score_mip_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'captain':
                    currentTaskData.captain = task.assignedTo || '';
                    currentTaskData.captain_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'ball':
                    currentTaskData.ball = task.assignedTo || '';
                    currentTaskData.ball_accept = task.accepted ? 'true' : 'false';
                    break;
            }
        });
        
        // 保存済みデータと比較（boolean値と文字列の両方に対応）
        const getAcceptValue = (value: string | boolean | undefined): string => {
            if (value === true || value === 'true') return 'true';
            return 'false';
        };
        
        const savedData = {
            video: existingKanjiData[3] || '',
            video_accept: getAcceptValue(existingKanjiData[4]),
            drone_video: existingKanjiData[5] || '',
            drone_video_accept: getAcceptValue(existingKanjiData[6]),
            drone_prep: existingKanjiData[7] || '',
            drone_prep_accept: getAcceptValue(existingKanjiData[8]),
            score_mip: existingKanjiData[9] || '',
            score_mip_accept: getAcceptValue(existingKanjiData[10]),
            captain: existingKanjiData[11] || '',
            captain_accept: getAcceptValue(existingKanjiData[12]),
            ball: existingKanjiData[13] || '',
            ball_accept: getAcceptValue(existingKanjiData[14])
        };
        
        // 各フィールドを比較
        return (
            currentTaskData.video !== savedData.video ||
            currentTaskData.video_accept !== savedData.video_accept ||
            currentTaskData.drone_video !== savedData.drone_video ||
            currentTaskData.drone_video_accept !== savedData.drone_video_accept ||
            currentTaskData.drone_prep !== savedData.drone_prep ||
            currentTaskData.drone_prep_accept !== savedData.drone_prep_accept ||
            currentTaskData.score_mip !== savedData.score_mip ||
            currentTaskData.score_mip_accept !== savedData.score_mip_accept ||
            currentTaskData.captain !== savedData.captain ||
            currentTaskData.captain_accept !== savedData.captain_accept ||
            currentTaskData.ball !== savedData.ball ||
            currentTaskData.ball_accept !== savedData.ball_accept
        );
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
                    taskData.video = task.assignedTo || '';
                    taskData.video_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'drone_video':
                    taskData.drone_video = task.assignedTo || '';
                    taskData.drone_video_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'drone_prep':
                    taskData.drone_prep = task.assignedTo || '';
                    taskData.drone_prep_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'score_mip':
                    taskData.score_mip = task.assignedTo || '';
                    taskData.score_mip_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'captain':
                    taskData.captain = task.assignedTo || '';
                    taskData.captain_accept = task.accepted ? 'true' : 'false';
                    break;
                case 'ball':
                    taskData.ball = task.assignedTo || '';
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
        
        // 保存後、kanjiTasksを更新して変更をリセット
        const updatedKanjiData = [
            data.id || '',
            data.event_id,
            data.act_date,
            data.video,
            data.video_accept,
            data.drone_video,
            data.drone_video_accept,
            data.drone_prep,
            data.drone_prep_accept,
            data.score_mip,
            data.score_mip_accept,
            data.captain,
            data.captain_accept,
            data.ball,
            data.ball_accept,
            data.last_update,
            data.update_user
        ];
        
        setKanjiTasks(prev => {
            const index = prev.findIndex(row => row[1] === event.ID);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = updatedKanjiData;
                return updated;
            } else {
                return [...prev, updatedKanjiData];
            }
        });
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

                {viewMode === 'grid' ? (
                    <>
                        {/* 設定セクション */}
                        <Paper elevation={2} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#757575' }}>
                                    {lang === 'ja-JP' ? 'ローテーション順設定' : 'Rotation Order Settings'}
                                </Typography>
                                <IconButton
                                    onClick={() => setShowSettings(!showSettings)}
                                    size="small"
                                    sx={{ color: '#757575' }}
                                >
                                    {showSettings ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            </Box>
                            {showSettings && (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
                                        {lang === 'ja-JP' ? '幹事のアサイン順番を設定します。上下ボタンで順番を変更できます。ローテーションから除外する場合はスイッチをOFFにしてください。' : 'Set the assignment order for kanji. Use up/down buttons to change the order. Turn off the switch to exclude from rotation.'}
                                    </Typography>
                                    
                                    {/* ローテーション順の幹事 */}
                                    {rotationOrder.length > 0 && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#757575', fontWeight: 'bold' }}>
                                                {lang === 'ja-JP' ? 'ローテーション順' : 'Rotation Order'}
                                            </Typography>
                                            <List>
                                                {rotationOrder.map((userId, index) => {
                                                    const user = users.find(u => u[2] === userId);
                                                    if (!user) return null;
                                                    
                                                    return (
                                                        <ListItem
                                                            key={userId}
                                                            sx={{
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: 1,
                                                                mb: 1,
                                                                backgroundColor: '#fafafa'
                                                            }}
                                                            secondaryAction={
                                                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                                    <Switch
                                                                        checked={true}
                                                                        onChange={() => toggleKanjiExclusion(userId)}
                                                                        size="small"
                                                                        sx={{ mr: 1 }}
                                                                    />
                                                                    <IconButton
                                                                        edge="end"
                                                                        onClick={() => moveKanjiUp(index)}
                                                                        disabled={index === 0}
                                                                        size="small"
                                                                    >
                                                                        <ArrowUpward fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        edge="end"
                                                                        onClick={() => moveKanjiDown(index)}
                                                                        disabled={index === rotationOrder.length - 1}
                                                                        size="small"
                                                                    >
                                                                        <ArrowDownward fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            }
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                                                                <Chip 
                                                                    label={`${index + 1}`}
                                                                    size="small"
                                                                    sx={{ 
                                                                        minWidth: 32, 
                                                                        height: 24,
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: '#3f51b5',
                                                                        color: 'white'
                                                                    }}
                                                                />
                                                                <AvatarIcon
                                                                    picUrl={user[4]}
                                                                    name={user[1]}
                                                                    width={32}
                                                                    height={32}
                                                                    showTooltip={true}
                                                                />
                                                                <Typography variant="body2">
                                                                    {user[1]}
                                                                </Typography>
                                                            </Box>
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        </Box>
                                    )}
                                    
                                    {/* 除外された幹事 */}
                                    {users
                                        .filter(user => user[3] === '幹事' && user[1] !== '忍' && excludedKanji.has(user[2]))
                                        .length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#757575', fontWeight: 'bold' }}>
                                                {lang === 'ja-JP' ? 'ローテーションから除外' : 'Excluded from Rotation'}
                                            </Typography>
                                            <List>
                                                {users
                                                    .filter(user => user[3] === '幹事' && user[1] !== '忍' && excludedKanji.has(user[2]))
                                                    .map((user) => {
                                                        const userId = user[2];
                                                        
                                                        return (
                                                            <ListItem
                                                                key={userId}
                                                                sx={{
                                                                    border: '1px solid #e0e0e0',
                                                                    borderRadius: 1,
                                                                    mb: 1,
                                                                    backgroundColor: '#f5f5f5',
                                                                    opacity: 0.6
                                                                }}
                                                                secondaryAction={
                                                                    <Switch
                                                                        checked={false}
                                                                        onChange={() => toggleKanjiExclusion(userId)}
                                                                        size="small"
                                                                    />
                                                                }
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                                                                    <AvatarIcon
                                                                        picUrl={user[4]}
                                                                        name={user[1]}
                                                                        width={32}
                                                                        height={32}
                                                                        showTooltip={true}
                                                                    />
                                                                    <Typography variant="body2">
                                                                        {user[1]}
                                                                    </Typography>
                                                                </Box>
                                                            </ListItem>
                                                        );
                                                    })}
                                            </List>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Paper>
                        
                        {/* イベント一覧コントロール */}
                        <Box sx={{ mb: 2 }}>
                            {/* 1行目: EventList と Show Past Events */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                            {/* 2行目: AutoAssign, Save, 表示切替 */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleBulkAIAssignment}
                                    disabled={isAssigning}
                                    sx={{ display: 'none', minWidth: 'auto', px: 2 }}
                                >
                                    {isAssigning ? (lang === 'ja-JP' ? '配置中...' : 'Assigning...') : (lang === 'ja-JP' ? 'Auto Assign（一括登録）' : 'Auto Assign')}
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleBulkSave}
                                    disabled={isSaving || !hasAnyChanges()}
                                    sx={{ minWidth: 'auto', px: 2 }}
                                >
                                    {isSaving ? (lang === 'ja-JP' ? '保存中...' : 'Saving...') : (lang === 'ja-JP' ? '一括保存' : 'Bulk Save')}
                                </Button>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                        onClick={() => setViewMode('card')}
                                        color="default"
                                        size="small"
                                    >
                                        <ViewList />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setViewMode('grid')}
                                        color="primary"
                                        size="small"
                                    >
                                        <ViewModule />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                        
                        <Paper elevation={2} sx={{ mb: 2 }}>
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                                            {lang === 'ja-JP' ? '日付' : 'Date'}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                                            {lang === 'ja-JP' ? 'ビデオ' : 'Video'}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                                            {lang === 'ja-JP' ? 'ドローン' : 'Drone'}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                                            {lang === 'ja-JP' ? 'MIP' : 'MIP'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events
                                        .filter(event => showPastEvents || event.event_status !== 99)
                                        .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                                        .map((event) => {
                                        const eventTasks = tasks.filter(task => task.eventId === event.ID);
                                        const videoTask = eventTasks.find(task => task.taskName === 'video');
                                        const droneTask = eventTasks.find(task => task.taskName === 'drone_prep');
                                        const mipTask = eventTasks.find(task => task.taskName === 'score_mip');
                                        
                                        // イベントの参加者を取得
                                        const attendees = getEventAttendees(event.ID);
                                        const attendeeIds = attendees.map(att => att.user_id);
                                        
                                        const getAssigneeName = (task: Task | undefined) => {
                                            if (!task || !task.assignedTo) return '';
                                            const user = users.find(u => u[2] === task.assignedTo);
                                            return user ? user[1] : task.assignedToName || '';
                                        };
                                        
                                        const getAssigneePicUrl = (task: Task | undefined) => {
                                            if (!task || !task.assignedTo) return undefined;
                                            const user = users.find(u => u[2] === task.assignedTo);
                                            return user && user[4] ? user[4] : undefined;
                                        };
                                        
                                        // タスクにアサインされている人が参加者リストに含まれているかチェック
                                        const isAssigneeAttending = (task: Task | undefined): boolean => {
                                            if (!task || !task.assignedTo) return false;
                                            return attendeeIds.includes(task.assignedTo);
                                        };
                                        
                                        // ハイライト用のスタイル
                                        const getCellStyle = (task: Task | undefined) => {
                                            const baseStyle: React.CSSProperties = { padding: '12px' };
                                            if (task && task.assignedTo && !isAssigneeAttending(task)) {
                                                return { ...baseStyle, backgroundColor: '#ffebee' };
                                            }
                                            return baseStyle;
                                        };

                                        return (
                                            <tr key={event.ID} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {new Date(event.start_datetime).toLocaleString('ja-JP', {
                                                            timeZone: 'Asia/Singapore',
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            weekday: 'short'
                                                        })}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#757575' }}>
                                                        {event.event_name}
                                                    </Typography>
                                                </td>
                                                <td style={getCellStyle(videoTask)}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                                            <Select
                                                                value={videoTask?.assignedTo || ""}
                                                                onChange={(e) => {
                                                                    if (videoTask) {
                                                                        handleAssigneeChange(videoTask.id, e.target.value);
                                                                    } else {
                                                                        handleNewAssignee(event.ID, 'video', e.target.value);
                                                                    }
                                                                }}
                                                                size="small"
                                                                displayEmpty
                                                                sx={{
                                                                    '& .MuiSelect-select': {
                                                                        backgroundColor: videoTask?.assignedTo && 
                                                                            !attendeeIds.includes(videoTask.assignedTo) 
                                                                            ? '#ffebee' : 'inherit'
                                                                    }
                                                                }}
                                                            >
                                                                <MenuItem value="">
                                                                    {lang === 'ja-JP' ? 'アサイン' : 'Assign'}
                                                                </MenuItem>
                                                                {(() => {
                                                                    const allKanjiUsers = users.filter(user => user[3] === '幹事' && user[1] !== '忍');
                                                                    // rotationOrderの順序に従って並べ替え
                                                                    const sortedUsers = [
                                                                        ...rotationOrder.map(userId => allKanjiUsers.find(u => u[2] === userId)).filter((u): u is string[] => u !== undefined),
                                                                        ...allKanjiUsers.filter(u => !rotationOrder.includes(u[2]))
                                                                    ];
                                                                    return sortedUsers.map((user) => (
                                                                        <MenuItem 
                                                                            key={user[2]} 
                                                                            value={user[2]}
                                                                            sx={{
                                                                                backgroundColor: !attendeeIds.includes(user[2]) 
                                                                                    ? '#ffebee' : 'inherit'
                                                                            }}
                                                                        >
                                                                            {user[1]}
                                                                        </MenuItem>
                                                                    ));
                                                                })()}
                                                            </Select>
                                                        </FormControl>
                                                        {videoTask && videoTask.assignedTo && (
                                                            <>
                                                                <AvatarIcon
                                                                    picUrl={getAssigneePicUrl(videoTask)}
                                                                    name={getAssigneeName(videoTask)}
                                                                    width={24}
                                                                    height={24}
                                                                    showTooltip={true}
                                                                />
                                                                {videoTask.accepted && (
                                                                    <CheckCircle color="success" fontSize="small" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Box>
                                                </td>
                                                <td style={getCellStyle(droneTask)}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                                            <Select
                                                                value={droneTask?.assignedTo || ""}
                                                                onChange={(e) => {
                                                                    if (droneTask) {
                                                                        handleAssigneeChange(droneTask.id, e.target.value);
                                                                    } else {
                                                                        handleNewAssignee(event.ID, 'drone_prep', e.target.value);
                                                                    }
                                                                }}
                                                                size="small"
                                                                displayEmpty
                                                                sx={{
                                                                    '& .MuiSelect-select': {
                                                                        backgroundColor: droneTask?.assignedTo && 
                                                                            !attendeeIds.includes(droneTask.assignedTo) 
                                                                            ? '#ffebee' : 'inherit'
                                                                    }
                                                                }}
                                                            >
                                                                <MenuItem value="">
                                                                    {lang === 'ja-JP' ? 'アサイン' : 'Assign'}
                                                                </MenuItem>
                                                                {(() => {
                                                                    const allKanjiUsers = users.filter(user => user[3] === '幹事' && user[1] !== '忍');
                                                                    // rotationOrderの順序に従って並べ替え
                                                                    const sortedUsers = [
                                                                        ...rotationOrder.map(userId => allKanjiUsers.find(u => u[2] === userId)).filter((u): u is string[] => u !== undefined),
                                                                        ...allKanjiUsers.filter(u => !rotationOrder.includes(u[2]))
                                                                    ];
                                                                    return sortedUsers.map((user) => (
                                                                        <MenuItem 
                                                                            key={user[2]} 
                                                                            value={user[2]}
                                                                            sx={{
                                                                                backgroundColor: !attendeeIds.includes(user[2]) 
                                                                                    ? '#ffebee' : 'inherit'
                                                                            }}
                                                                        >
                                                                            {user[1]}
                                                                        </MenuItem>
                                                                    ));
                                                                })()}
                                                            </Select>
                                                        </FormControl>
                                                        {droneTask && droneTask.assignedTo && (
                                                            <>
                                                                <AvatarIcon
                                                                    picUrl={getAssigneePicUrl(droneTask)}
                                                                    name={getAssigneeName(droneTask)}
                                                                    width={24}
                                                                    height={24}
                                                                    showTooltip={true}
                                                                />
                                                                {droneTask.accepted && (
                                                                    <CheckCircle color="success" fontSize="small" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Box>
                                                </td>
                                                <td style={getCellStyle(mipTask)}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                                            <Select
                                                                value={mipTask?.assignedTo || ""}
                                                                onChange={(e) => {
                                                                    if (mipTask) {
                                                                        handleAssigneeChange(mipTask.id, e.target.value);
                                                                    } else {
                                                                        handleNewAssignee(event.ID, 'score_mip', e.target.value);
                                                                    }
                                                                }}
                                                                size="small"
                                                                displayEmpty
                                                                sx={{
                                                                    '& .MuiSelect-select': {
                                                                        backgroundColor: mipTask?.assignedTo && 
                                                                            !attendeeIds.includes(mipTask.assignedTo) 
                                                                            ? '#ffebee' : 'inherit'
                                                                    }
                                                                }}
                                                            >
                                                                <MenuItem value="">
                                                                    {lang === 'ja-JP' ? 'アサイン' : 'Assign'}
                                                                </MenuItem>
                                                                {(() => {
                                                                    const allKanjiUsers = users.filter(user => user[3] === '幹事' && user[1] !== '忍');
                                                                    // rotationOrderの順序に従って並べ替え
                                                                    const sortedUsers = [
                                                                        ...rotationOrder.map(userId => allKanjiUsers.find(u => u[2] === userId)).filter((u): u is string[] => u !== undefined),
                                                                        ...allKanjiUsers.filter(u => !rotationOrder.includes(u[2]))
                                                                    ];
                                                                    return sortedUsers.map((user) => (
                                                                        <MenuItem 
                                                                            key={user[2]} 
                                                                            value={user[2]}
                                                                            sx={{
                                                                                backgroundColor: !attendeeIds.includes(user[2]) 
                                                                                    ? '#ffebee' : 'inherit'
                                                                            }}
                                                                        >
                                                                            {user[1]}
                                                                        </MenuItem>
                                                                    ));
                                                                })()}
                                                            </Select>
                                                        </FormControl>
                                                        {mipTask && mipTask.assignedTo && (
                                                            <>
                                                                <AvatarIcon
                                                                    picUrl={getAssigneePicUrl(mipTask)}
                                                                    name={getAssigneeName(mipTask)}
                                                                    width={24}
                                                                    height={24}
                                                                    showTooltip={true}
                                                                />
                                                                {mipTask.accepted && (
                                                                    <CheckCircle color="success" fontSize="small" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Box>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                    </>
                ) : (
                    <>
                        {/* イベント一覧コントロール */}
                        <Box sx={{ mb: 2 }}>
                            {/* 1行目: EventList と Show Past Events */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                            {/* 2行目: 表示切替 */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                        onClick={() => setViewMode('card')}
                                        color="primary"
                                        size="small"
                                    >
                                        <ViewList />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setViewMode('grid')}
                                        color="default"
                                        size="small"
                                    >
                                        <ViewModule />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                        
                        {events
                            .filter(event => showPastEvents || event.event_status !== 99)
                            .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                            .map((event) => {
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
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleSaveEvent(event)}
                                                disabled={!hasChanges(event.ID)}
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
                                        
                                        // 全幹事を取得（「忍」は除外）
                                        const allKanjiUsers = users
                                            .filter(user => user[3] === '幹事' && user[1] !== '忍')
                                            .map(user => ({
                                                userId: user[2],
                                                userName: user[1],
                                                userPic: user[4]
                                            }));
                                        
                                        // rotationOrderの順序に従って並べ替え
                                        const allAvailableKanji = [
                                            ...rotationOrder.map(userId => allKanjiUsers.find(k => k.userId === userId)).filter((k): k is { userId: string; userName: string; userPic: string } => k !== undefined),
                                            ...allKanjiUsers.filter(k => !rotationOrder.includes(k.userId))
                                        ];
                                        
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
                                                                <MenuItem value="">
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
                    </>
                )}

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
                                        {lang === 'ja-JP' ? 'ビデオ' : 'Video'}
                                    </th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {lang === 'ja-JP' ? 'ドローン' : 'Drone'}
                                    </th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {lang === 'ja-JP' ? 'MIP' : 'MIP'}
                                    </th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {lang === 'ja-JP' ? '合計/参加数' : 'Total/Events'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {kanjiStats.map((stat) => (
                                    <tr key={stat.userId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AvatarIcon 
                                                picUrl={stat.userPic}
                                                name={stat.userName}
                                                width={24}
                                                height={24}
                                                showTooltip={true}
                                            />
                                            <span>{stat.userName}</span>
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            {stat.videoTasks}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            {stat.droneTasks}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            {stat.mipTasks}
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