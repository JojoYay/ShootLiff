import React from 'react';
import { Grid, Typography, Box } from '@mui/material';

interface CalendarGridProps {
    calendar: (string | { day: number, events: CalendarEvent[] })[][];
    daysOfWeek: string[];
    currentDate: Date;
    BALL: string;
    BEER: string;
}

interface CalendarEvent {
    event_type: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ calendar, daysOfWeek, currentDate, BALL, BEER }) => {
    return (
        <Grid item xs={12}>
            <Grid container>
                {daysOfWeek.map((dayOfWeek, index) => {
                    const isWeekendHeader = index === 0 || index === 6; // 0: Sunday, 6: Saturday
                    const headerBackgroundColor = isWeekendHeader ? '#ffebee' : '#bbdefb'; // 週末は薄赤、平日/その他は水色
                    return (
                        <Grid item xs={12/7} key={index} p={1} bgcolor={headerBackgroundColor} style={{ textAlign: 'center', border: '1px solid #ccc' }}>
                            <Typography variant="body1" style={{ color: '#3f51b5', fontWeight: 'bold' }}>{dayOfWeek}</Typography>
                        </Grid>
                    );
                })}
            </Grid>
            <Grid container>
                {/* 日付表示 */}
                {calendar.map((week, weekIndex) => (
                    <Grid container key={weekIndex}>
                        {week.map((dayData, dayIndex) => {
                            const isWeekend = dayIndex === 0 || dayIndex === 6; // 0: Sunday, 6: Saturday
                            const isCurrentDay = typeof dayData === 'object' && dayData.day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                            let backgroundColor = 'transparent';
                            if (isWeekend) {
                                backgroundColor = '#ffebee'; // 薄い赤色
                            }
                            if (isCurrentDay) {
                                backgroundColor = '#e0f7fa'; // 現在の日の色
                            }

                            return (
                                <Grid item xs={12/7} key={dayIndex} sx={{
                                    textAlign: 'center',
                                    border: '1px solid #ccc',
                                    minHeight: '60px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    backgroundColor: backgroundColor // 背景色を適用
                                }}>
                                    <Typography variant="body1" color={isCurrentDay ? '#f44336' : '#555'} fontWeight={isCurrentDay ? 'bold' : 'normal'}>{typeof dayData === 'object' ? dayData.day : dayData}</Typography>
                                    {typeof dayData === 'object' && dayData.events.length > 0 && dayData.events.map((event, eventIndex) => ( // dayData.events を表示
                                        <Box key={eventIndex} sx={{ marginTop: '5px', display: 'flex', alignItems: 'center'} }>
                                            {event.event_type === 'フットサル' && (
                                                <img src={BALL} alt="フットサル" width={28} height={28} />
                                            )}
                                            {event.event_type === '飲み会' && (
                                                <img src={BEER} alt="飲み会" width={28} height={28} />
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