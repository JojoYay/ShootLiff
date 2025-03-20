'use client';
import React from 'react';
import { Paper, Box, Typography, IconButton, Collapse, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CalendarEvent } from '../types/calendar';
import { BALL, BEER, LOGO } from '../utils/constants';
import AvatarIcon from '../stats/avatarIcon';
import { Profile } from '../types/user';
import { useRouter } from 'next/navigation';

interface NextEventCardProps {
    nextEvent: CalendarEvent | null;
    lang: string;
    expandedEventDetails: { [key: string]: boolean };
    handleToggleDetails: (key: string) => void;
    pendingParticipationStatus: { [eventId: string]: '〇' | '△' | '×' };
    isUserManager: boolean;
    isProxyReplyMode: boolean;
    proxyReplyUser: Profile | null;
    users: string[][];
    handleParticipationChange: (event: CalendarEvent, status: '〇' | '△' | '×', userId?: string) => void;
    profile: Profile | null;
    setProxyReplyUser: React.Dispatch<React.SetStateAction<Profile | null>>;
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
                    {isUserManager && (
                        <ProxyReplyButton />
                    )}
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
                    <Typography variant="h6" sx={{ color: '#757575', minWidth: '160px' }}>
                        {new Date(nextEvent.start_datetime).toLocaleDateString(lang, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        }).replace(/-/g, '/')}
                        {new Date(nextEvent.start_datetime).toLocaleTimeString(lang, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        })}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#424242' }}>
                        {nextEvent.event_name} @ {nextEvent.place}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#757575' }}>
                        〇: {nextEvent.attendances?.filter(att => att.status === '〇').length || 0},
                        △: {nextEvent.attendances?.filter(att => att.status === '△').length || 0},
                        ×: {nextEvent.attendances?.filter(att => att.status === '×').length || 0}
                    </Typography>
                    <Typography variant="body1" style={{ color: '#757575', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {renderRemarkWithLinks(nextEvent.remark)}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push(`/calendar/input?calendarId=${nextEvent.ID}`)}
                        size='small'
                    >
                        支払い
                    </Button>
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
};