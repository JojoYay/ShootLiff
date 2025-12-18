'use client';
import React from 'react';
import { Paper, Box, Typography, IconButton, Collapse, FormControl, InputLabel, Select, MenuItem, Button, Autocomplete, TextField } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CalendarEvent } from '../types/calendar';
import { BALL, BEER, LOGO } from '../utils/constants';
import { User, JsonUser } from '../types/user';
import { useRouter } from 'next/navigation';
import AttendanceList from './attendanceList';

interface NextEventCardProps {
    nextEvent: CalendarEvent | null;
    lang: string;
    expandedEventDetails: { [key: string]: boolean };
    handleToggleDetails: (key: string) => void;
    pendingParticipationStatus: { [eventId: string]: '〇' | '△' | '×' };
    isUserManager: boolean;
    isProxyReplyMode: boolean;
    proxyReplyUser: User | null;
    users: JsonUser[];
    handleParticipationChange: (event: CalendarEvent, status: '〇' | '△' | '×', userId: string, adultCount:number, children:string[]) => void;
    profile: User | null;
    setProxyReplyUser: React.Dispatch<React.SetStateAction<User | null>>;
    ProxyReplyButton: () => React.JSX.Element;
    SaveButton:() => React.JSX.Element;
    pendingParticipationStatusCount: { [eventId: string]: { adult: number; children: string[] } };
    jsonUsers: JsonUser[];
    filteredUsers: JsonUser[];
    attendance: any[];
}


export const NextEventCard: React.FC<NextEventCardProps> = ({
    nextEvent,
    lang,
    expandedEventDetails,
    handleToggleDetails,
    pendingParticipationStatus,
    isUserManager,
    isProxyReplyMode,
    proxyReplyUser,
    users,
    handleParticipationChange,
    profile,
    setProxyReplyUser,
    ProxyReplyButton,
    SaveButton,
    pendingParticipationStatusCount,
    filteredUsers,
    jsonUsers,
    attendance
}) => {

    const router = useRouter();
    if (!nextEvent) {
        return null;
    }

    function renderRemarkWithLinks(remark: string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = remark.split(urlRegex);
        
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                // URLの場合のみ25文字で切り詰め
                const displayUrl = part.length > 25 ? part.slice(0, 25) + '...' : part;
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                        {displayUrl}
                    </a>
                );
            }
            // URL以外のテキストは改行を<br />に置換
            return <span key={index}>{part.split('\n').map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < part.split('\n').length - 1 && <br />}
                </React.Fragment>
            ))}</span>;
        });
    }

    // ユーザーのプロファイルから子供の名前を取得する関数
    function getChildrenNames(userId: string | undefined | null): string[] {
        if (!userId) return [];
        const user = jsonUsers.find(u => u["LINE ID"] === userId);
        if (!user) return [];
        const children: string[] = [];
        for (let i = 1; i <= 5; i++) {
            const childKey = `child${i}`;
            if (user[childKey] && user[childKey].trim() !== '') {
                children.push(user[childKey]);
            }
        }
        return children;
    }

    // 既存のattendanceからTRUEの位置を読み取って、対応する子供の名前を取得する関数
    function getSelectedChildrenFromAttendance(userId: string | undefined | null, attendance: any): string[] {
        if (!userId || !attendance) return [];
        const user = jsonUsers.find(u => u["LINE ID"] === userId);
        if (!user) return [];
        
        const selectedChildren: string[] = [];
        for (let i = 1; i <= 5; i++) {
            const childKey = `child${i}`;
            const childValue = attendance[childKey];
            if (childValue === 'TRUE' || childValue === true || childValue === 'true') {
                const childName = user[childKey];
                if (childName && childName.trim() !== '') {
                    selectedChildren.push(childName);
                }
            }
        }
        return selectedChildren;
    }

    // attendanceからchild1-child5にTRUEが入っている数をカウントする関数
    function getChildCountFromAttendance(attendance: any): number {
        if (!attendance) return 0;
        let count = 0;
        for (let i = 1; i <= 5; i++) {
            const childKey = `child${i}`;
            const childValue = attendance[childKey];
            if (childValue === 'TRUE' || childValue === true || childValue === 'true') {
                count++;
            }
        }
        return count;
    }

    // 参加者リストから子供の数を計算する関数
    // getAllAttendanceForDayAndEvent関数内で既に保留中の変更が反映されているので、
    // ここでは単純にattendanceから取得する
    function getChildCountForAttendee(attendance: any, eventId: string, userId: string): number {
        return getChildCountFromAttendance(attendance);
    }
        
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="h6" sx={{ color: '#3f51b5' }}>
                        {lang === 'ja-JP' ? '次回の予定' : 'Next Event'}
                    </Typography>
                    {isUserManager && (
                        <ProxyReplyButton />
                    )}
                </Box>
                <Box>
                    <IconButton
                        size="small"
                        onClick={() => handleToggleDetails('next_event')}
                        sx={{ color: '#3f51b5' }}
                    >
                        {expandedEventDetails['next_event'] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>

                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent:'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent:'center' }}>
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
                <Box sx={{ flex: 1, flexDirection:"column" }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#757575', mr:'5px'}}>
                            {new Date(nextEvent.start_datetime).toLocaleDateString(lang, {
                                month: '2-digit',
                                day: '2-digit',
                                weekday: 'short'
                            }).replace(/-/g, '/')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#757575', mr:'5px'}}>
                            {new Date(nextEvent.start_datetime).toLocaleTimeString(lang, {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })}
                            -
                            {new Date(nextEvent.end_datetime).toLocaleTimeString(lang, {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })}
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: '#424242' }}>
                        {nextEvent.event_name} @ {nextEvent.place}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                        {(() => {
                            const oAttendances = nextEvent.attendances?.filter(att => att.status === '〇') || [];
                            // 保留中の変更があるユーザーの元のattendanceデータを取得
                            const pendingUserId = pendingParticipationStatusCount[nextEvent.ID]?.children !== undefined ? profile?.userId : null;
                            const originalAttendance = pendingUserId 
                                ? attendance.find((att: any) => 
                                    att.user_id === pendingUserId &&
                                    att.calendar_id === nextEvent.ID &&
                                    parseInt(att.year) === new Date(nextEvent.start_datetime).getFullYear() &&
                                    parseInt(att.month) === (new Date(nextEvent.start_datetime).getMonth() + 1) &&
                                    parseInt(att.date) === new Date(nextEvent.start_datetime).getDate()
                                )
                                : null;
                            const originalChildCount = originalAttendance ? getChildCountFromAttendance(originalAttendance) : 0;
                            
                            const childTotal = oAttendances.reduce((total, att) => {
                                const count = getChildCountForAttendee(att, nextEvent.ID, att.user_id);
                                // 保留中の変更があるユーザーの場合、元の数を引いて新しい数を足す
                                if (pendingUserId && att.user_id === pendingUserId) {
                                    return total - originalChildCount + count;
                                }
                                return total + count;
                            }, 0);
                            
                            return (
                                <>
                                    〇 親: {oAttendances.reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                                    子: {childTotal || 0}, 
                                    △: {nextEvent.attendances?.filter(att => att.status === '△').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                                    ×: {nextEvent.attendances?.filter(att => att.status === '×').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}
                                </>
                            );
                        })()}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ flex: 1, mt:'3px' }}>
                {/* 参加者選択コンボボックス（代理返信モード時のみ表示） */}
                {isProxyReplyMode && (
                    <Autocomplete
                        options={users}
                        getOptionLabel={(option) => option["伝助上の名前"]} // 表示するラベル
                        value={proxyReplyUser ? users.find(user => user["LINE ID"] === proxyReplyUser.userId) : null}
                        onChange={(event, newValue) => {
                            if (newValue) {
                                setProxyReplyUser({
                                    userId: newValue["LINE ID"],
                                    lineName: newValue["ライン上の名前"],
                                    isKanji: newValue["幹事フラグ"] === '幹事',
                                    displayName: newValue["伝助上の名前"],
                                    pictureUrl: newValue["Picture"],
                                });
                            } else {
                                setProxyReplyUser(null);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label={lang === 'ja-JP' ? '代理ユーザーを選択' : 'Select Proxy User'} variant="outlined" />
                        )}
                    />
              )}
                {/* 参加ステータス選択 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt:2, mb:2, flexDirection:'row' }}>
              
      <FormControl size="small">
                        <InputLabel id="status-select-label">{lang === 'ja-JP' ? '参加可否' : 'Status'}</InputLabel>
                        <Select
                            labelId='status-select-label'
                            value={
                                isProxyReplyMode && proxyReplyUser
                                    ? (nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId)?.status || '')
                                    : (nextEvent.attendance?.status || '')
                            }
                            onChange={(e) => {
                                const userIdToUse = isProxyReplyMode ? proxyReplyUser?.userId || '' : profile?.userId || '';
                                const adultCount = isProxyReplyMode && proxyReplyUser
                                    ? pendingParticipationStatusCount[nextEvent.ID]?.adult ?? 1
                                    : pendingParticipationStatusCount[nextEvent.ID]?.adult ?? nextEvent.attendance?.adult_count ?? 1;
                                const children = isProxyReplyMode && proxyReplyUser
                                    ? pendingParticipationStatusCount[nextEvent.ID]?.children || []
                                    : getSelectedChildrenFromAttendance(userIdToUse, nextEvent.attendance);
                                handleParticipationChange(
                                    nextEvent,
                                    e.target.value as '〇' | '△' | '×',
                                    userIdToUse,
                                    adultCount,
                                    children
                                );
                            }}
                            disabled={isProxyReplyMode && !proxyReplyUser} // 代理返信モードでユーザーが選択されていない場合はdisabled
                        >
                            <MenuItem value={'〇'}>〇</MenuItem>
                            <MenuItem value={'△'}>△</MenuItem>
                            <MenuItem value={'×'}>×</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" >
                        <InputLabel id="adult-count-select-label">{lang === 'ja-JP' ? '大人' : 'Adult'}</InputLabel>
                        <Select
                            labelId="adult-count-select-label"
                            id="adult-count-select"
                            disabled={isProxyReplyMode && !proxyReplyUser} // 代理返信モードでユーザーが選択されていない場合はdisabled
                            // value={nextEvent.attendance?.adult_count || 1}
                            value={
                                isProxyReplyMode && proxyReplyUser
                                ? (nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId)?.adult_count ?? 1)
                                : (nextEvent.attendance?.adult_count ?? 1)
                            }
                            label={lang === 'ja-JP' ? '大人' : 'Adult'}
                            onChange={(e) => {
                                if(nextEvent.ID){
                                    const currentStatus = pendingParticipationStatus[nextEvent.ID] || nextEvent.attendance?.status || '〇' as '〇' | '△' | '×';
                                    const userIdToUse = isProxyReplyMode && proxyReplyUser ? proxyReplyUser.userId : profile?.userId || '';
                                    const children = isProxyReplyMode && proxyReplyUser
                                        ? pendingParticipationStatusCount[nextEvent.ID]?.children || []
                                        : getSelectedChildrenFromAttendance(userIdToUse, nextEvent.attendance);
                                    handleParticipationChange(
                                        nextEvent,
                                        currentStatus,
                                        userIdToUse,
                                        e.target.value as number,
                                        children
                                    );
                                    if(nextEvent.attendance && !isProxyReplyMode){
                                        nextEvent.attendance.adult_count = e.target.value as number;
                                    }
                                }
                            }}
                        >
                            {Array.from({ length: 10 }, (_, i) => (
                                <MenuItem key={i} value={i} sx={{width:'100%'}} >{i}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {(() => {
                        const userIdToUse = isProxyReplyMode && proxyReplyUser ? proxyReplyUser.userId : profile?.userId;
                        const childrenNames = getChildrenNames(userIdToUse);
                        // 子供が登録されていない場合はコンボボックスを非表示
                        if (childrenNames.length === 0) {
                            return null;
                        }
                        return (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel id="child-select-label">{lang === 'ja-JP' ? '子供' : 'Child'}</InputLabel>
                                <Select
                                    labelId="child-select-label"
                                    id="child-select"
                                    multiple
                                    value={
                                        isProxyReplyMode && proxyReplyUser
                                            ? (pendingParticipationStatusCount[nextEvent.ID]?.children !== undefined
                                                ? (pendingParticipationStatusCount[nextEvent.ID]?.children || [])
                                                : (() => {
                                                    // 代理ユーザーのattendanceを取得
                                                    const proxyAttendance = nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId);
                                                    return getSelectedChildrenFromAttendance(proxyReplyUser.userId, proxyAttendance || null);
                                                })())
                                            : (pendingParticipationStatusCount[nextEvent.ID]?.children !== undefined
                                                ? (pendingParticipationStatusCount[nextEvent.ID]?.children || [])
                                                : getSelectedChildrenFromAttendance(
                                                    userIdToUse,
                                                    nextEvent.attendance
                                                ))
                                    }
                                    disabled={isProxyReplyMode && !proxyReplyUser} // 代理返信モードでユーザーが選択されていない場合はdisabled
                                    label={lang === 'ja-JP' ? '子供' : 'Child'}
                                    onChange={(e) => {
                                        if(nextEvent.ID){
                                            const selectedChildren = typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[];
                                            const currentStatus = pendingParticipationStatus[nextEvent.ID] || nextEvent.attendance?.status || '〇' as '〇' | '△' | '×';
                                            const adultCount = isProxyReplyMode && proxyReplyUser
                                                ? (pendingParticipationStatusCount[nextEvent.ID]?.adult ?? 1)
                                                : (pendingParticipationStatusCount[nextEvent.ID]?.adult ?? nextEvent.attendance?.adult_count ?? 1);
                                            handleParticipationChange(
                                                nextEvent,
                                                currentStatus,
                                                userIdToUse || '',
                                                adultCount,
                                                selectedChildren
                                            );
                                        }
                                    }}
                                    renderValue={(selected) => {
                                        if (Array.isArray(selected) && selected.length > 0) {
                                            return selected.join(', ');
                                        }
                                        return '';
                                    }}
                                >
                                    {childrenNames.map((name, index) => (
                                        <MenuItem key={index} value={name}>
                                            {name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        );
                    })()}
                </Box>
                <Box sx={{ flex: 1, m:'3px' }}>
                    {Object.keys(pendingParticipationStatus).length > 0 && <SaveButton />}
                    {process.env.NEXT_PUBLIC_APP_TITLE === 'Scout App' ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => router.push(`/calendar/expense?calendarId=${nextEvent.ID}`)}
                            size='small'
                        >
                            清算
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => router.push(`/calendar/input?calendarId=${nextEvent.ID}`)}
                            size='small'
                        >
                            支払い
                        </Button>
                    )}
                </Box>

                <Collapse in={expandedEventDetails['next_event']} timeout="auto" unmountOnExit>
                    {/* 参加者リスト */}
                    <Typography variant="body1" style={{ color: '#757575', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {renderRemarkWithLinks(nextEvent.remark)}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                            <AttendanceList lang={lang} attendances={nextEvent.attendances || []} status="〇" pendingParticipationStatusCount={pendingParticipationStatusCount} eventId={nextEvent.ID} />
                        </Box>
                        <Box>
                            <AttendanceList lang={lang} attendances={nextEvent.attendances || []} status="△" pendingParticipationStatusCount={pendingParticipationStatusCount} eventId={nextEvent.ID} />
                        </Box>
                        <Box>
                            <AttendanceList lang={lang} attendances={nextEvent.attendances || []} status="×" pendingParticipationStatusCount={pendingParticipationStatusCount} eventId={nextEvent.ID} />
                        </Box>
                        {filteredUsers.length > 0 && (
                            <Box>
                                <AttendanceList 
                                    lang={lang} 
                                    attendances={[]} 
                                    status="?" 
                                    filteredUsers={filteredUsers}
                                />
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </Box>

        </Paper>
    );
};