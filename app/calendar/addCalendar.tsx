import { Button } from '@mui/material';
import React from 'react';

const AddCalendarButton = () => {
    // 公開カレンダーのURLを指定
    // const publicCalendarUrl = 'https://calendar.google.com/calendar/ical/your_calendar_id/public/basic.ics';
    const publicCalendarUrl = process.env.NEXT_PUBLIC_CALENDAR_URL;
    // カレンダーを追加する関数
    const addCalendar = () => {
        if(publicCalendarUrl){
            // Google Calendarの追加リンクを生成
            // const addCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(publicCalendarUrl)}`;
            window.open(publicCalendarUrl, '_blank');
        }
    };

    return (
        <Button onClick={addCalendar} color="primary" variant="contained" sx={{marginTop:'5px'}} >
            Add to Google Calendar
        </Button>
    );
};

export default AddCalendarButton;