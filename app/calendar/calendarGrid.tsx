import React from 'react';
import { Grid, Typography, Box } from '@mui/material';

interface CalendarGridProps {
    calendar: (string | { day: number, events: CalendarEvent[] })[][];
    daysOfWeek: string[];
    currentDate: Date;
    BALL: string;
    BEER: string;
    LOGO: string;
}

interface CalendarEvent {
    event_type: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ calendar, daysOfWeek, currentDate, BALL, BEER, LOGO }) => {
    return (
        <Grid item xs={12}>
            <Grid container>
                {daysOfWeek.map((dayOfWeek, index) => {
                    let headerBackgroundColor = '#e0e0e0'; // 基本灰色
                    if (index === 5) headerBackgroundColor = '#bbdefb'; // 土曜は青色
                    if (index === 6) headerBackgroundColor = '#ffebee'; // 日曜は赤色

                    return (
                        <Grid item xs={12/7} key={index} p={1} bgcolor={headerBackgroundColor} style={{ textAlign: 'center', border: '1px solid #ccc' }}>
                            <Typography variant="body1" style={{ color: '#3f51b5', fontWeight: 'bold' }}>{dayOfWeek}</Typography>
                        </Grid>
                    );
                })}
            </Grid>
            <Grid container>
                {calendar.map((week, weekIndex) => (
                    <Grid container key={weekIndex}>
                        {week.map((dayData, dayIndex) => {
                            const isCurrentDay = typeof dayData === 'object' && dayData.day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                            const backgroundColor = isCurrentDay ? '#e0f7fa' : 'white'; // 現在の日の色、その他は白色

                            return (
                                <Grid item xs={12/7} key={dayIndex} sx={{
                                    textAlign: 'center',
                                    border: '1px solid #ccc',
                                    minHeight: '60px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    backgroundColor: backgroundColor
                                }}>
                                    <Typography variant="body1" color={isCurrentDay ? '#f44336' : '#555'} fontWeight={isCurrentDay ? 'bold' : 'normal'}>{typeof dayData === 'object' ? dayData.day : dayData}</Typography>
                                    {typeof dayData === 'object' && dayData.events.length > 0 && dayData.events.map((event, eventIndex) => (
                                        <Box key={eventIndex} sx={{ marginTop: '5px', display: 'flex', alignItems: 'center'} }>
                                            {event.event_type === 'フットサル' && (
                                                <img src={BALL} alt="フットサル" width={28} height={28} />
                                            )}
                                            {event.event_type === '飲み会' && (
                                                <img src={BEER} alt="飲み会" width={28} height={28} />
                                            )}
                                            {event.event_type === 'いつもの' && (
                                                <img src={LOGO} alt="いつもの" width={28} height={28} />
                                            )}

                                        </Box>
                                    ))}
                                </Grid>
                            );
                        })}
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
};
export default CalendarGrid;