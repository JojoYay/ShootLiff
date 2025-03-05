 'use client';
import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    FormControlLabel,
    Switch
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, SpaceBar } from '@mui/icons-material';
import { useLiff } from '../liffProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja/index.js';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';

interface Event {
    id: string;
    event_type: string;
    event_name: string;
    start_datetime: string;
    end_datetime: string;
    place: string;
    remark: string;
    recursive_type: number;
}

export default function EventManager() {
    const [events, setEvents] = useState<Event[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const BALL:string = 'https://lh3.googleusercontent.com/d/1_snlf9rvRFpCg0nx4NlW57Z9PaGcPIn-';
    const BEER:string = 'https://lh3.googleusercontent.com/d/1XrzK_UDQHB25toU-Zg0dXauXbLF-AV1T';
    // Form state
    const [formData, setFormData] = useState<Event>({
        id: '',
        event_type: 'フットサル',
        event_name: '',
        start_datetime: new Date().toISOString(),
        end_datetime: new Date().toISOString(),
        place: '',
        remark: '',
        recursive_type: 0
    });
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [startTime, setStartTime] = useState<Date | null>(new Date());
    const [endTime, setEndTime] = useState<Date | null>(new Date(new Date().getTime() + 60 * 60 * 1000)); // デフォルトで1時間後
    const [showFinishedEvents, setShowFinishedEvents] = useState<boolean>(false); // state を追加
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // 追加: 二重送信防止用 state

    // const { liff } = useLiff();
    useEffect(() => {
		fetchEvents();
	}, []);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            let url = process.env.SERVER_URL + '?func=loadCalendar';
            if (url) {
                const response = await fetch(url);
                const data = await response.json();
                const processedEvents = data.calendar.slice(1).map((item: string[]) => ({
                    id: item[0],
                    event_type: item[1],
                    event_name: item[2],
                    start_datetime: item[3],
                    end_datetime: item[4],
                    place: item[5],
                    remark: item[6],
                    recursive_type: parseInt(item[7])
                }));
                // 日時順にソート
                processedEvents.sort((a: Event, b: Event) => {
                    return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
                });
                // console.log(processedEvents);
                setEvents(processedEvents);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedEvent(null);
        setFormData({
            id: '',
            event_type: 'フットサル',
            event_name: '',
            start_datetime: new Date().toISOString(),
            end_datetime: new Date().toISOString(),
            place: '',
            remark: '',
            recursive_type: 0
        });
        setSelectedDate(new Date());
        setStartTime(new Date());
        setEndTime(new Date(new Date().getTime() + 60 * 60 * 1000));
        setOpen(true);
    };

    const handleEdit = (event: Event) => {
        setSelectedEvent(event);
        setFormData(event);
        setSelectedDate(new Date(event.start_datetime));
        setStartTime(new Date(event.start_datetime));
        setEndTime(new Date(event.end_datetime));       
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('本当に削除しますか？')) {
            try {
                setIsSubmitting(true);
                const formData = new FormData();
                formData.append('func', 'deleteCalendar');
                formData.append('id', id);

                let url = process.env.SERVER_URL;
                if (url) {
                    const response = await fetch(url, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        fetchEvents();
                    }
                }
            } catch (error) {
                console.error('Error deleting event:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const formDataToSend = new FormData();
            formDataToSend.append('func', selectedEvent ? 'updateCalendar' : 'createCalendar');

            // Combine date and times into ISO strings
            if (selectedDate && startTime && endTime) {
                const startDate = new Date(selectedDate);
                const startTimeDate = new Date(startTime);
                const endTimeDate = new Date(endTime);

                startDate.setHours(startTimeDate.getHours());
                startDate.setMinutes(startTimeDate.getMinutes());
                formData.start_datetime = startDate.toISOString();

                const endDate = new Date(selectedDate); // Use the same date for end date as per requirement
                endDate.setHours(endTimeDate.getHours());
                endDate.setMinutes(endTimeDate.getMinutes());
                formData.end_datetime = endDate.toISOString();
            }            


            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'id' && !selectedEvent) return; // Skip ID for new events
                formDataToSend.append(key, value.toString());
            });

            let url = process.env.SERVER_URL;
            if (url) {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formDataToSend
                });

                if (response.ok) {
                    setOpen(false);
                    fetchEvents();
                }
            }
        } catch (error) {
            console.error('Error saving event:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box width={'100%'}>
            <Paper style={{margin:'5px', padding:'5px'}}>
                <Grid container spacing={2} alignItems="center" padding={'5px'}>
                    <Grid item xs>
                        <Typography variant="h6" component="h6">
                            {'イベント管理'}
                        </Typography>
                    </Grid>
                    <Grid item xs>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAdd}
                            style={{margin:'5px'}}
                        >
                            {'新規'}
                        </Button>
                    </Grid>
                </Grid>
                <Box display="flex" justifyContent="center"> {/* Center the switch */}
                    <FormControlLabel
                        control={<Switch checked={showFinishedEvents} onChange={(e) => setShowFinishedEvents(e.target.checked)} />}
                        label="終了イベントを表示"
                    />
                </Box>
            </Paper>
            {isLoading ? (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '80vh'
                }}>
                    <Box sx={{
                        '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                        },
                    }}>
                        <img
                            src="https://lh3.googleusercontent.com/d/1THCGfK2zDU5Vp1dAMgew8VTFV1soE-x7"
                            alt="ローディング"
                            style={{
                                width: '48px',
                                height: '48px',
                                animation: 'spin 2s linear infinite',
                            }}
                        />
                    </Box>
                </Box>
            ) : (
                
                events.map((event) => {
                    const isPastEvent = new Date(event.end_datetime) < new Date();
                    if (!showFinishedEvents && isPastEvent) {
                        return null; // 過去イベントを非表示
                    }
                    return (
                    <Card key={event.id} style={{'margin':'5px'}} >
                        <CardContent style={{ textAlign: 'left', padding:'3px', margin:'3px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {event.event_type === 'フットサル' && (
                                        <img src={BALL} alt="フットサル" width={24} height={24} style={{ marginRight: 8 }} />
                                    )}
                                    {event.event_type === '飲み会' && (
                                        <img src={BEER} alt="飲み会" width={24} height={24} style={{ marginRight: 8 }} />
                                    )}
                                    <Typography variant="h6" color="text.secondary">
                                        {new Date(event.start_datetime).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </Typography>
                                    <Box sx={{ width: '8px' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(event.start_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_datetime).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <IconButton size="small" onClick={() => handleEdit(event)} disabled={isSubmitting}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(event.id)} disabled={isSubmitting}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', margin:'3px'}}>
                                <Typography variant="body2" component="div">
                                    {event.event_name}
                                </Typography>
                            </Box>
                            {event.place && (
                                <Typography variant="body2" color="text.secondary">
                                    場所: {event.place}
                                </Typography>
                            )}
                            {event.remark && (
                                <Typography variant="body2" color="text.secondary">
                                    備考: {event.remark}
                                </Typography>
                            )}                            
                        </CardContent>
                    </Card>
                    )
                })
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedEvent 
                        ? ('イベントを編集')
                        : ('新規イベント')
                    }
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                            <InputLabel id="event-type-select-label">{'イベント種別'}</InputLabel >
                                <Select
                                    labelId="event-type-select-label"
                                    id="event-type-select"
                                    value={formData.event_type}
                                    label={'イベント種別'}
                                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value as Event['event_type'] })}
                                >
                                    <MenuItem value="フットサル">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img src={BALL} alt="フットサル" width={24} height={24} style={{ marginRight: 8 }} />
                                            フットサル
                                        </Box>
                                    </MenuItem >
                                    <MenuItem value="飲み会">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img src={BEER} alt="パーティー" width={24} height={24} style={{ marginRight: 8 }} />
                                            パーティー
                                        </Box>
                                    </MenuItem >
                                </Select >
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={'イベント名'}
                                value={formData.event_name}
                                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                                <DatePicker
                                    label={'日付'}
                                    value={selectedDate}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            setSelectedDate(newValue);
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                           <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                                <TimePicker
                                    label={'開始時間'}
                                    value={startTime}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            setStartTime(newValue);
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                           <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                                <TimePicker
                                    label={'終了時間'}
                                    value={endTime}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            setEndTime(newValue);
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={'場所'}
                                value={formData.place}
                                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={'備考'}
                                value={formData.remark}
                                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>
                        {'キャンセル'}
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                        {'保存'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}