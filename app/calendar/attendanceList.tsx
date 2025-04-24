import React from 'react';
import { Box, Typography } from '@mui/material';
import AvatarIcon from '../stats/avatarIcon';
import { Attendance } from '../types/calendar';


interface AttendanceListProps {
    lang: string;
    attendances: Attendance[];
    status: string;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ lang, attendances = [], status }) => { // Default to empty array
    const filteredAttendances = attendances.filter(att => att.status === status);
    const totalAdults = filteredAttendances.reduce((total, att) => total + (att.adult_count || 1), 0);
    const totalChildren = filteredAttendances.reduce((total, att) => total + (att.child_count || 0), 0);
    return (
        <Box>
            <Typography variant="subtitle2" style={{ color: '#757575', fontWeight: 'bold' }}>{lang === 'ja-JP' ? '参加者' : 'Attendees'}:
                <Typography variant="body2" sx={{ color: '#757575' }}>
                大人: {totalAdults}, 子供: {totalChildren} 
                </Typography>
            </Typography>

            {process.env.NEXT_PUBLIC_APP_TITLE === 'Scout App' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap',}}>
                        {filteredAttendances.map((attend, index) => (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
                                    <AvatarIcon
                                        key={index} 
                                        name={attend.profile?.displayName || ''} 
                                        picUrl={attend.profile?.pictureUrl}  
                                        width={24} height={24} showTooltip={true} 
                                    />
                                    <Typography variant="subtitle2" sx={{marginLeft:'3px', marginRight:'3px'}}>{`大人:${attend.adult_count || '1'}`}</Typography>
                                    <Typography variant="subtitle2" sx={{marginLeft:'3px', marginRight:'3px'}}>{`子供:${attend.child_count || '0'}`}</Typography>
                                </Box>
                            </>
                        ))}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {filteredAttendances.map((attend, index) => (
                        <AvatarIcon
                            key={index} 
                            name={`${attend.profile?.displayName} 大人:${attend.adult_count || '1'} 子供:${attend.child_count || '0'}`} 
                            picUrl={attend.profile?.pictureUrl}  
                            width={24} height={24} showTooltip={true} 
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default AttendanceList;