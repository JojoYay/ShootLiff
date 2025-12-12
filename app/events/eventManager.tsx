'use client';
import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LocalDiningRounded } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja/index.js';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import LoadingSpinner from '../calendar/loadingSpinner';
import Link from 'next/link';
import { BALL, BEER, LOGO } from '../utils/constants';
import LoadingModal from '../components/LoadingModal';

interface Event {
    id: string;
    event_type: 'フットサル' | '飲み会' | 'いつもの';
    event_name: string;
    start_datetime: string;
    end_datetime: string;
    place: string;
    remark: string;
    event_status: number; //0:NYS,10:WIP, 99:completed
    pitch_fee: string; // ピッチ代を追加
    paynow_link: string; // paynow先を追加
    paticipation_fee: string;
}

export default function EventManager() {
    const [events, setEvents] = useState<Event[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Form state
    const [formData, setFormData] = useState<Event>({
        id: '',
        event_type: 'フットサル',
        event_name: '',
        start_datetime: new Date().toISOString(),
        end_datetime: new Date().toISOString(),
        place: '',
        remark: '',
        event_status: 0,
        pitch_fee: '', // 初期値を追加
        paynow_link: '', // 初期値を追加
        paticipation_fee: ''
    
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
            let url = process.env.NEXT_PUBLIC_SERVER_URL + '?func=loadCalendar';
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
                    event_status: parseInt(item[7]),
                    pitch_fee: parseInt(item[8]) || '',
                    paynow_link: item[9] || '',
                    paticipation_fee: item[10] || ''
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
            event_status: 0,
            pitch_fee: '',
            paynow_link: '',
            paticipation_fee: '',
        });
        setSelectedDate(new Date());
        setStartTime(new Date());
        setEndTime(new Date(new Date().getTime() + 120 * 60 * 1000));
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
                const eventToDelete = events.find(event => event.id === id); // 削除対象のイベントを取得
                const formData = new FormData();
                formData.append('func', 'deleteCalendar');
                formData.append('id', id);

                let url = process.env.NEXT_PUBLIC_SERVER_URL;
                if (url) {
                    const response = await fetch(url, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        if (eventToDelete && eventToDelete.event_status === 20) {
                            // Find the earliest event that is not 99 and set its status to 20
                            const earliestEvent = events
                                .filter(e => e.event_status !== 99 && e.id !== id) // 削除対象を除外
                                .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];
                            if (earliestEvent) {
                                await updateEventStatus(earliestEvent, 20);
                            }
                        }
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
        // イベント名のバリデーション
        if (!formData.event_name) {
            alert('イベント名を入力してください。');
            return; // 空の場合は処理を中断
        }
        if (!selectedDate) {
            alert('日程を入力してください。');
            return; // 空の場合は処理を中断
        }
        if (!startTime) {
            alert('開始時刻を入力してください。');
            return; // 空の場合は処理を中断
        }

        
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
                console.log(key, value.toString());
            });

            let url = process.env.NEXT_PUBLIC_SERVER_URL;
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

    // Add a function to update the event status
    const updateEventStatus = async (event: Event, newStatus: number) => {
        const formDataToSend = new FormData();
        formDataToSend.append('func', 'updateEventStatus');
        formDataToSend.append('id', event.id);
        formDataToSend.append('new_status', newStatus.toString());

        let url = process.env.NEXT_PUBLIC_SERVER_URL;
        if (url) {
            const response = await fetch(url, {
                method: 'POST',
                body: formDataToSend
            });

            if (response.ok) {
                fetchEvents();
            }
        }
    };

    // Add a function to handle status change logic
    const handleStatusChange = async (event: Event, newStatus: number) => {
        try{
            setIsSubmitting(true);

            if (newStatus === 20) {
                // Ensure only one event can have status 20
                const currentTargetEvent = events.find(e => e.event_status === 20);
                if (currentTargetEvent) {
                    await updateEventStatus(currentTargetEvent, 0);
                }
            } else if (newStatus === 99) {
                // Find the earliest event that is not 99 and set its status to 20
                const earliestEvent = events
                    .filter(e => e.event_status !== 99)
                    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];
                if (earliestEvent) {
                    await updateEventStatus(earliestEvent, 20);
                }
            }
            await updateEventStatus(event, newStatus);

        } catch (error) {
            console.error('Error updating event status:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderRemarkWithLinks = (remark: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = remark.split(urlRegex);
        
        return parts.map((part, index) => {
            const isUrl = urlRegex.test(part);
            
            // URLの場合は省略、通常のテキストは省略しない
            if (isUrl) {
                const displayText = part.length > 25 ? part.slice(0, 25) + '...' : part;
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                        {displayText}
                    </a>
                );
            }
            
            // 通常のテキストは改行を <br /> に置き換え、省略しない
            const formattedPart = part.split('\n').map((line, lineIndex, array) => (
                <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < array.length - 1 && <br />}
                </React.Fragment>
            ));
            
            return <span key={index}>{formattedPart}</span>;
        });
    }

    const handlePresetFill = () => {
        if(process.env.NEXT_PUBLIC_APP_TITLE === 'Scout App'){
            setFormData({
                id: '',
                event_type: 'いつもの',
                event_name: '',
                start_datetime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
                end_datetime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
    
                place: '',
                remark: '',
                event_status: 0,
                pitch_fee: '',
                paynow_link: '',
                paticipation_fee: '',
            });
        } else {
            setFormData({
                id: '',
                event_type: 'いつもの',
                event_name: '日曜定期',
                start_datetime: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
                end_datetime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    
                place: 'Premier Pitch Khalsa',
                remark: 'https://maps.app.goo.gl/3Zmq48uFkPEvB6cKA',
                event_status: 0,
                pitch_fee: '',
                paynow_link: '',
                paticipation_fee: '',
            });
        }
        setSelectedDate(null); // 日付は空欄
        setStartTime(new Date(new Date().setHours(7, 0, 0, 0)));
        setEndTime(new Date(new Date().setHours(9, 0, 0, 0)));
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
                <LoadingSpinner />
            ) : (
                
                events.map((event) => {
                    const isPastEvent = event.event_status === 99
                    if (!showFinishedEvents && isPastEvent) {
                        return null; // 過去イベントを非表示
                    }
                    return (
                    <Card key={event.id} style={{'margin':'5px'}} >
                        <CardContent style={{ textAlign: 'left', padding:'3px', margin:'3px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {(event.event_type === 'フットサル') && (
                                        <img src={BALL} alt="フットサル" width={24} height={24} style={{ marginRight: 8 }} />
                                    )}
                                    {event.event_type === '飲み会' && (
                                        <img src={BEER} alt="飲み会" width={24} height={24} style={{ marginRight: 8 }} />
                                    )}
                                    {event.event_type === 'いつもの' && (
                                        <img src={LOGO} alt="いつもの" width={24} height={24} style={{ marginRight: 8 }} />
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
                                    {event.event_name} @ {event.place}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', margin:'3px', justifyContent: 'space-between'}} >
                                {(event.event_type === 'フットサル' || event.event_type === 'いつもの') && (
                                    <Typography variant="body2" color="text.secondary" sx={{ marginRight: 2 }}>
                                    {event.event_status === 0 ? 
                                        <Box component="span" sx={{ border: '1px solid', borderRadius: '4px', padding: '2px' }}>
                                            {'集計前'}
                                        </Box>
                                    : event.event_status === 10 ? 
                                        <Box component="span" sx={{ border: '1px solid', borderRadius: '4px', padding: '2px' }}>
                                            {'集計開始'}
                                        </Box>
                                    : event.event_status === 20 ? (
                                        <Box component="span" sx={{ color: 'orange', border: '1px solid orange', borderRadius: '4px', padding: '2px' }}>
                                            {'集計対象'}
                                        </Box>
                                    ) : event.event_status === 99 ? (
                                        <Box component="span" sx={{ color: 'grey', border: '1px solid grey', borderRadius: '4px', padding: '2px' }}>
                                            {'集計完了'}
                                        </Box>
                                    ) : null}
                                </Typography>
                                )}
                            </Box>
                            {event.remark && (
                                <Typography variant="body2" color="text.secondary">
                                    {renderRemarkWithLinks(event.remark)}
                                </Typography>
                            )}
                            {event.pitch_fee && (
                                <Typography variant="body2" color="text.secondary">
                                    {event.event_type === 'フットサル' || event.event_type === 'いつもの' ? 'ピッチ代' : '部費拠出金'}:{event.pitch_fee}
                                </Typography>
                            )}
                            {event.paticipation_fee && (
                                <Typography variant="body2" color="text.secondary">
                                    参加費: {event.paticipation_fee}
                                </Typography>
                            )}
                            {event.paynow_link && (
                                <Typography variant="body2" color="text.secondary">
                                    PayNow先: {event.paynow_link}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
                                {event.event_status !== 20 && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleStatusChange(event, 20)}
                                        disabled={isSubmitting}
                                        sx={{ marginRight: 1 }}
                                    >
                                        集計対象にする
                                    </Button>
                                )}
                                {event.event_status === 20 && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleStatusChange(event, 99)}
                                        disabled={isSubmitting}
                                        sx={{ marginRight: 1 }}
                                    >
                                        集計完了にする
                                    </Button>
                                )}
                                <Link href={`/expense/create?calendarId=${event.id}`} passHref>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        component="a" // Link を Button としてレンダリング
                                        disabled={isSubmitting}
                                    >
                                        経費作成
                                    </Button>
                                </Link>
                            </Box>
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
                        {!selectedEvent ? 
                        <Grid item xs={12}>
                            <Button variant="contained" onClick={handlePresetFill} fullWidth>
                                定型入力
                            </Button>
                        </Grid>
                        : null}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="event-type-select-label">{'イベント種別'}</InputLabel>
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
                                    </MenuItem>
                                    <MenuItem value="飲み会">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img src={BEER} alt="パーティー" width={24} height={24} style={{ marginRight: 8 }} />
                                            パーティー
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="いつもの">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img src={LOGO} alt="いつもの" width={24} height={24} style={{ marginRight: 8 }} />
                                            いつもの
                                        </Box>
                                    </MenuItem>                                    
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                size='small'
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
                                size='small'
                                fullWidth
                                label={'場所'}
                                value={formData.place}
                                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                size='small'
                                fullWidth
                                label={'ピッチ代・部費拠出金'}
                                type="text"
                                value={formData.pitch_fee}
                                onChange={(e) => setFormData({ ...formData, pitch_fee: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                size='small'
                                fullWidth
                                label={'参加費'}
                                type="text"
                                value={formData.paticipation_fee}
                                onChange={(e) => setFormData({ ...formData, paticipation_fee: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                size='small'
                                fullWidth
                                label={'PayNow先'}
                                value={formData.paynow_link}
                                onChange={(e) => setFormData({ ...formData, paynow_link: e.target.value })}
                            />
                        </Grid>                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                size='small'
                                fullWidth
                                multiline
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
            <LoadingModal open={isSubmitting} />
        </Box>
    );
}