'use client';
import React from 'react';
import { Paper, Box, Typography, IconButton, Collapse, FormControl, InputLabel, Select, MenuItem, Button, Autocomplete, TextField } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CalendarEvent } from '../types/calendar';
import { BALL, BEER, LOGO } from '../utils/constants';
import AvatarIcon from '../stats/avatarIcon';
import { User } from '../types/user';
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
    users: string[][];
    handleParticipationChange: (event: CalendarEvent, status: '〇' | '△' | '×', userId: string, adultCount:number, childCount:number) => void;
    profile: User | null;
    setProxyReplyUser: React.Dispatch<React.SetStateAction<User | null>>;
    ProxyReplyButton: () => React.JSX.Element;
    SaveButton:() => React.JSX.Element;
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
    SaveButton
}) => {

    const router = useRouter();
    if (!nextEvent) {
        return null;
    }

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
                        〇 親: {nextEvent.attendances?.filter(att => att.status === '〇').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                        子: {nextEvent.attendances?.filter(att => att.status === '〇').reduce((total, att) => total + (att.child_count || 0), 0) || 0}, 
                        △: {nextEvent.attendances?.filter(att => att.status === '△').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                        {/* {process.env.NEXT_PUBLIC_APP_TITLE === 'Scout App' && (
                            <>子: {nextEvent.attendances?.filter(att => att.status === '△').reduce((total, att) => total + (att.child_count || 0), 0) || 0}, </>
                        )} */}
                        ×: {nextEvent.attendances?.filter(att => att.status === '×').reduce((total, att) => total + (att.adult_count || 1), 0) || 0}, 
                        {/* {process.env.NEXT_PUBLIC_APP_TITLE === 'Scout App' && (
                            <>子: {nextEvent.attendances?.filter(att => att.status === '×').reduce((total, att) => total + (att.child_count || 0), 0) || 0}</>
                        )} */}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ flex: 1, mt:'3px' }}>
                {/* 参加者選択コンボボックス（代理返信モード時のみ表示） */}
                {isProxyReplyMode && (
                    <Autocomplete
                        options={users}
                        getOptionLabel={(option) => option[1]} // 表示するラベル
                        value={proxyReplyUser ? users.find(user => user[2] === proxyReplyUser.userId) : null}
                        onChange={(event, newValue) => {
                            if (newValue) {
                                setProxyReplyUser({
                                    userId: newValue[2],
                                    lineName: newValue[0],
                                    isKanji: newValue[3] === '幹事',
                                    displayName: newValue[1],
                                    pictureUrl: newValue[4],
                                });
                            } else {
                                setProxyReplyUser(null);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label={lang === 'ja-JP' ? '代理ユーザーを選択' : 'Select Proxy User'} variant="outlined" />
                        )}
                    />

                    // <FormControl fullWidth margin="dense" size="small">
                    //     <InputLabel id="proxy-user-select-label">{lang === 'ja-JP' ? '代理ユーザーを選択' : 'Select Proxy User'}</InputLabel>
                    //     <Select
                    //         labelId="proxy-user-select-label"
                    //         id="proxy-user-select"
                    //         value={proxyReplyUser ? proxyReplyUser.userId : ''}
                    //         label={lang === 'ja-JP' ? '代理ユーザーを選択' : 'Select Proxy User'}
                    //         onChange={(e) => {
                    //             const selectedUser = users.find(user => user[2] === e.target.value);
                    //             if (selectedUser) {
                    //                 setProxyReplyUser({
                    //                     userId: selectedUser[2],
                    //                     lineName:selectedUser[0],
                    //                     isKanji:selectedUser[3] === '幹事',
                    //                     displayName: selectedUser[1],
                    //                     pictureUrl: selectedUser[4],
                    //                 });
                    //             } else {
                    //                 setProxyReplyUser(null);
                    //             }
                    //         }}
                    //     >
                    //         {users.map((user, index) => (
                    //             <MenuItem key={index} value={user[2]}>
                    //                 {user[1]}
                    //             </MenuItem>
                    //         ))}
                    //     </Select>
                    // </FormControl>
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
                                handleParticipationChange(
                                    nextEvent,
                                    e.target.value as '〇' | '△' | '×',
                                    isProxyReplyMode ? proxyReplyUser?.userId || '' : profile?.userId || '', // ユーザーIDを渡す
                                    nextEvent.attendance?.adult_count || 1, nextEvent.attendance?.child_count || 0
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
                            // value={nextEvent.attendance?.adult_count || 1}
                            value={
                                isProxyReplyMode && proxyReplyUser
                                ? (nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId)?.adult_count || 1)
                                : (nextEvent.attendance?.adult_count || 1)
                            }
                            label={lang === 'ja-JP' ? '大人' : 'Adult'}
                            onChange={(e) => {
                                if(nextEvent.ID){
                                    if(isProxyReplyMode && proxyReplyUser){
                                        handleParticipationChange(nextEvent, nextEvent.attendance?.status as '〇' | '△' | '×', proxyReplyUser?.userId || '',  e.target.value as number, nextEvent.attendance?.child_count || 0);
                                    } else {
                                        handleParticipationChange(nextEvent, nextEvent.attendance?.status as '〇' | '△' | '×', profile?.userId || '',  e.target.value as number, nextEvent.attendance?.child_count || 0);
                                    }
                                    if(isProxyReplyMode && proxyReplyUser){
                                        if(nextEvent.attendances){
                                            const attendances = nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId);
                                            if(attendances){
                                                attendances.adult_count = e.target.value as number;
                                            }
                                        }
                                    } else {
                                        if(nextEvent.attendance){
                                            nextEvent.attendance.adult_count = e.target.value as number; // Update adultCount
                                        }
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
                            labelId="child-count-select-label"
                            id="child-count-select"
                            // value={nextEvent.attendance?.child_count || 0}
                            value={
                                isProxyReplyMode && proxyReplyUser
                                ? (nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId)?.child_count || 0)
                                : (nextEvent.attendance?.child_count || 0)
                            }

                            label={lang === 'ja-JP' ? '子供' : 'Child'}
                            onChange={(e) => {
                                if(nextEvent.ID){
                                    if(isProxyReplyMode && proxyReplyUser){
                                        handleParticipationChange(nextEvent, nextEvent.attendance?.status as '〇' | '△' | '×', proxyReplyUser?.userId || '', nextEvent.attendance?.adult_count || 1, e.target.value as number);
                                    } else {
                                        handleParticipationChange(nextEvent, nextEvent.attendance?.status as '〇' | '△' | '×', profile?.userId || '', nextEvent.attendance?.adult_count || 1,  e.target.value as number);
                                    }
                                    if(isProxyReplyMode && proxyReplyUser){
                                        if(nextEvent.attendances){
                                            const attendances = nextEvent.attendances?.find(att => att.user_id === proxyReplyUser.userId);
                                            if(attendances){
                                                attendances.child_count = e.target.value as number;
                                            }
                                        }
                                    } else {
                                        if(nextEvent.attendance){
                                            nextEvent.attendance.child_count = e.target.value as number; // Update adultCount
                                        }
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
                            <AttendanceList lang={lang} attendances={nextEvent.attendances || []} status="〇" />
                        </Box>
                        <Box>
                            <AttendanceList lang={lang} attendances={nextEvent.attendances || []} status="△" />
                        </Box>
                        <Box>
                            <AttendanceList lang={lang} attendances={nextEvent.attendances || []} status="×" />
                        </Box>
                    </Box>
                </Collapse>
            </Box>

        </Paper>
    );
};