import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableRow, IconButton, Tooltip, Divider } from '@mui/material';
import AvatarIcon from '../stats/avatarIcon';
import { Attendance } from '../types/calendar';
import { JsonUser } from '../types/user';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface AttendanceListProps {
    attendances: Attendance[];
    status: string;
    lang: string;
    filteredUsers?: JsonUser[];
    pendingParticipationStatusCount?: { [eventId: string]: { adult: number; children: string[] } };
    eventId?: string;
}

export default function AttendanceList({ attendances, status, lang, filteredUsers, pendingParticipationStatusCount, eventId }: AttendanceListProps) {
    const [isTableView, setIsTableView] = useState(false);

    const filteredAttendances = attendances.filter(attendance => attendance.status === status);
    if (filteredAttendances.length === 0 && status !== '?') return null;

    const statusText = status === '〇' ? (lang === 'ja-JP' ? '参加' : 'Yes') :
                      status === '△' ? (lang === 'ja-JP' ? '未定' : 'Maybe') :
                      status === '×' ? (lang === 'ja-JP' ? '不参加' : 'No') :
                      (lang === 'ja-JP' ? 'もしかして...' : 'Is he coming?...');

    // attendanceからchild1-child5にTRUEが入っている数をカウントする関数（保留中の変更も考慮）
    const getChildCountFromAttendance = (attendance: Attendance): number => {
        // 保留中の変更がある場合は、それを優先
        // ただし、保留中の変更は現在ログインしているユーザーのものなので、
        // この関数ではattendanceから直接取得する
        // （保留中の変更は、表示時に既に反映されているはず）
        let count = 0;
        for (let i = 1; i <= 5; i++) {
            const childKey = `child${i}` as keyof Attendance;
            const childValue = attendance[childKey] as string | boolean | undefined;
            // booleanのtrueまたは文字列の'TRUE'/'true'を判定
            if (childValue === true || childValue === 'TRUE' || childValue === 'true') {
                count++;
            }
        }
        return count;
    };

    const totalAdults = filteredAttendances.reduce((total, att) => total + (att.adult_count || 1), 0);
    const totalChildren = filteredAttendances.reduce((total, att) => total + getChildCountFromAttendance(att), 0);

    if (status === '?') {
        if (!filteredUsers || filteredUsers.length === 0) return null;
        return (
            <Box sx={{ m: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: '#757575', fontWeight: 'bold', flexGrow: 1 }}>
                        {statusText} ({filteredUsers.length}名)
                    </Typography>
                    <Tooltip title={isTableView ? (lang === 'ja-JP' ? 'リスト表示' : 'List') : (lang === 'ja-JP' ? 'グリッド表示' : 'Grid')}>
                        <IconButton onClick={() => setIsTableView(!isTableView)} size="small">
                            {isTableView ? <ViewModuleIcon /> : <ViewListIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
                {!isTableView ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {filteredUsers.map((user, index) => (
                            <AvatarIcon
                                key={index}
                                name={user["伝助上の名前"]}
                                picUrl={user["Picture"]}
                                width={24} height={24} showTooltip={true}
                            />
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {filteredUsers.map((user, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AvatarIcon
                                    name={user["伝助上の名前"]}
                                    picUrl={user["Picture"]}
                                    width={24} height={24} showTooltip={true}
                                />
                                <Typography variant="body2" sx={{ color: '#757575' }}>
                                    {user["伝助上の名前"]}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ m: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ color: '#757575', fontWeight: 'bold', flexGrow: 1 }}>
                    {statusText} ({filteredAttendances.length}名)
                </Typography>
                <Typography variant="subtitle2" sx={{ color: '#757575', mr: 2 }}>
                    {lang === 'ja-JP' ? `大人: ${totalAdults}, 子供: ${totalChildren}` : `Adult: ${totalAdults}, Child: ${totalChildren}`}
                </Typography>
                <Tooltip title={isTableView ? (lang === 'ja-JP' ? 'リスト表示' : 'List') : (lang === 'ja-JP' ? 'グリッド表示' : 'Grid')}>
                    <IconButton onClick={() => setIsTableView(!isTableView)} size="small">
                        {isTableView ? <ViewModuleIcon /> : <ViewListIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {isTableView ? (
                filteredAttendances.map((attend, index) => (
                    <Table key={index} size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ padding: '4px', width: '40px' }}>
                                    <AvatarIcon
                                        name={attend.profile?.displayName || ''} 
                                        picUrl={attend.profile?.pictureUrl}  
                                        width={24} height={24} showTooltip={true} 
                                    />
                                </TableCell>
                                <TableCell sx={{ padding: '4px', width: '120px' }}>
                                    <Typography variant="subtitle2" sx={{color: '#757575'}}>
                                        {attend.profile?.displayName}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ padding: '4px', width: '80px' }}>
                                    <Typography variant="subtitle2" sx={{color: '#757575'}}>
                                        {lang === 'ja-JP' ? `大人:${attend.adult_count || '1'}` : `Adult:${attend.adult_count || '1'}`}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ padding: '4px', width: '80px' }}>
                                    <Typography variant="subtitle2" sx={{color: '#757575'}}>
                                        {lang === 'ja-JP' ? `子供:${getChildCountFromAttendance(attend)}` : `Child:${getChildCountFromAttendance(attend)}`}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                ))
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {filteredAttendances.map((attend, index) => (
                        <AvatarIcon
                            key={index}
                            name={`${attend.profile?.displayName} ${lang === 'ja-JP' ? `大人:${attend.adult_count || '1'} 子供:${getChildCountFromAttendance(attend)}` : `Adult:${attend.adult_count || '1'} Child:${getChildCountFromAttendance(attend)}`}`}
                            picUrl={attend.profile?.pictureUrl}
                            width={24} height={24} showTooltip={true}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}