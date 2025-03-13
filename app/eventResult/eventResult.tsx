'use client';
import { Box, Button, MenuItem, Select, SelectChangeEvent, TextField, Typography,Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ListItemText, ListItem, List, FormControl, InputLabel, Divider } from '@mui/material';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../calendar/loadingSpinner';

const EventResult = () => {
    const [points, setPoints] = useState(Array(10).fill(0));
    const [weather, setWeather] = useState('晴れ');
    const [mipPlayers, setMipPlayers] = useState(Array(5).fill(''));
    const [participants, setParticipants] = useState<string[]>([]); // To hold participants for MIP selection
	const [events, setEvents] = useState<string[][]>([]);
    const [event, setEvent] = useState<string[]>([]);
    const [videos, setVideos] = useState<string[][]>([]);
    const [relatedVideos, setRelatedVideos] = useState<string[][]>([]);
    // const [users, setUsers] = useState<string[][]>([]);
    const [teamCount, setTeamCount] = useState<number>(4);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // 追加: 二重送信防止用 state
    // const [eventDetails, setEventDetails] = useState([]);
	// const [actDates, setActDates] = useState<string[] | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5; // Number of events per page

    useEffect(() => {
		fetchInfo();
    }, []);

	const fetchInfo = async () => {
        try {
			// const url = process.env.SERVER_URL + '?func=getVideos&func=getEventData&func=getUsers';
			const url = process.env.SERVER_URL + '?func=getVideos&func=getEventData';
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
				setVideos(data.videos.slice(2).reverse()); // Reverse the order
				// setUsers(data.users.slice(1));
				setEvents(data.events.slice(1));
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
        if(events.length > 0){
            const currentEvent = events[currentPage];
            console.log(currentEvent);
            setEvent(currentEvent);
            const relatedVideos = videos.filter(video => (video[0] === currentEvent[1] && !video[10].endsWith('_g'))).reverse(); // 試合タイトルに基づいて関連する動画をフィルタリング
            setRelatedVideos(relatedVideos);
            // Extracting data from the event
            const eventWeather = currentEvent[4]; // Weather is at index 4
            const eventMIP = currentEvent[5]; // MIP is at index 5
            const additionalMIPs = currentEvent.slice(17, 22).filter(mip => mip || '');
            const eventPoints = currentEvent.slice(7, 17).map(point => parseInt(point, 10));

            let teamNo = 4;//普通は４チーム
            if(relatedVideos.length === 3){
                teamNo = 3;//３チームってこと
            } else if(relatedVideos.length === 10){
                teamNo = 5;//５チームってこと
            }
            setTeamCount(teamNo);
            // Set the extracted values to state
            setWeather(eventWeather);
            const combinedMIPs = [eventMIP, ...additionalMIPs];
            const filledMIPs = [
                ...combinedMIPs,
                ...Array(5 - combinedMIPs.length).fill('') // Fill with empty strings
            ].slice(0, 5);
            setMipPlayers(filledMIPs);
            console.log(filledMIPs);
            setPoints(eventPoints);
            const eventParticipants = currentEvent[3].split(',').map(participant => participant.trim()); // Split participants
            setParticipants(eventParticipants);
        }
    }, [currentPage, events]);

    const handlePointChange = (index: number, value: number) => {
        const newPoints = [...points];
        newPoints[index] = value;
        setPoints(newPoints);
    };

    const handleWeatherChange = (event: SelectChangeEvent<string>) => {
        setWeather(event.target.value);
    };

    const handleMipPlayerChange = (index: number, value: string) => {
        const newMipPlayers = [...mipPlayers];
        newMipPlayers[index] = value;
        setMipPlayers(newMipPlayers);
    };

    // Calculate the events to display for the current page
    const displayedEvents = events.slice(currentPage, currentPage + 1);

    // Handle page change
    const handlePageChange = (direction: 'next' | 'prev') => {
        if (direction === 'next' && (currentPage + 1) * itemsPerPage < events.length - 1) {
            setCurrentPage(currentPage + 1);
        } else if (direction === 'prev' && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSaveEvent = async () => {
        try {
            setIsSubmitting(true);
            const formDataToSend = new FormData();
            formDataToSend.append('func', 'updateEventData');
            formDataToSend.append('title', event[1]);
            formDataToSend.append('weather', event[4]);
            formDataToSend.append('mip1', event[5]);
            formDataToSend.append('reason', event[6]);
            formDataToSend.append('team1', event[7]);
            formDataToSend.append('team2', event[8]);
            formDataToSend.append('team3', event[9]);
            formDataToSend.append('team4', event[10]);
            formDataToSend.append('team5', event[11]);
            formDataToSend.append('team6', event[12]);
            formDataToSend.append('team7', event[13]);
            formDataToSend.append('team8', event[14]);
            formDataToSend.append('team9', event[15]);
            formDataToSend.append('team10', event[16]);
            formDataToSend.append('mip2', event[17]);
            formDataToSend.append('mip3', event[18]);
            formDataToSend.append('mip4', event[19]);
            formDataToSend.append('mip5', event[20]);

            let url = process.env.SERVER_URL;
            if (url) {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formDataToSend
                });
                if (response.ok) {
                    fetchInfo();
                }
            }
        } catch (error) {
            console.error('Error updating event data:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (event.length >0 ? 
        <>
            <Box sx={{ padding: 2 }}>
                <Typography variant="h4" gutterBottom>イベント結果</Typography>
                <Box sx={{ marginBottom: 2 }}> 
                    <Typography variant="h6" gutterBottom>{event[1]}</Typography>
                    {relatedVideos.length > 0 ? (
                        <List>
                            {relatedVideos.map((video, videoIndex) => (
                                <ListItem key={videoIndex}>
                                    <ListItemText
                                        primary={`${video[3]} vs ${video[4]}`}
                                        secondary={`${video[7]} - ${video[8]} (勝ちチーム: ${video[9]})`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        null
                    )}
                    {relatedVideos.length === 3 ? (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>チーム名</TableCell>
                                        <TableCell>勝ち数</TableCell>
                                        <TableCell>負け数</TableCell>
                                        <TableCell>引分け数</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {['Team1', 'Team2', 'Team3', 'Team4', 'Team5', 'Team6', 'Team7', 'Team8', 'Team9', 'Team10'].map((team, index) => {
                                        const wins = relatedVideos.filter(video => video[9] === team).length; // Count wins
                                        const loses = relatedVideos.filter(video => (video[9] !== team && (team === video[3] || team === video[4]))).length; // Count wins
                                        const draws = relatedVideos.filter(video => (video[9] === 'draw' && (team === video[3] || team === video[4]))).length; // Count draw
                                        if(wins || loses || draws){
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>{team}</TableCell>
                                                    <TableCell>{wins}</TableCell>
                                                    <TableCell>{loses}</TableCell>
                                                    <TableCell>{draws}</TableCell>                                                </TableRow>
                                            );
                                        } else {
                                            return null;
                                        }
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : null}
                    <Divider sx={{ margin: '16px 0' }} />
                    <Box sx={{ marginBottom: 2 }}>
                        {/* <Typography variant="h6" gutterBottom>{event[1]}</Typography> */}

                        <FormControl fullWidth sx={{ marginBottom: 2 }}>
                            <InputLabel>天気</InputLabel>
                            <Select
                                value={weather}
                                onChange={(e) => setWeather(e.target.value)}
                            >
                                <MenuItem value="晴れ">晴れ</MenuItem>
                                <MenuItem value="曇り">曇り</MenuItem>
                                <MenuItem value="雨">雨</MenuItem>
                            </Select>
                        </FormControl>

                        {points.map((point, teamIndex) => {
                            if(teamIndex < teamCount){
                              return (
                                    <FormControl fullWidth sx={{ marginBottom: 2 }} key={teamIndex}>
                                        <InputLabel>{`Team ${teamIndex + 1} ポイント`}</InputLabel>
                                        <Select
                                            value={point}
                                            onChange={(e) => {
                                                const newPoints = [...points];
                                                newPoints[teamIndex] = e.target.value as number;
                                                setPoints(newPoints);
                                            }}
                                        >
                                            {Array.from({ length: 11 }, (_, num) => (
                                                <MenuItem key={num} value={num}>{num}</MenuItem>
                            ))}
                                        </Select>
                                    </FormControl>
                                )
                            } else {
                                return null;
                            }
                        }
                        )}
                        <Divider sx={{ margin: '16px 0' }} />

                        {mipPlayers.map((mipPlayer, mipIndex) => (
                            <FormControl fullWidth sx={{ marginBottom: 2 }} key={mipIndex}>
                                <InputLabel>{`MIPプレイヤー ${mipIndex + 1}`}</InputLabel>
                                <Select
                                    value={mipPlayer}
                                    onChange={(e) => {
                                        const newMipPlayers = [...mipPlayers];
                                        newMipPlayers[mipIndex] = e.target.value as string;
                                        setMipPlayers(newMipPlayers);
                                    }}
                                >
                                    {participants.filter((participant, idx) => !mipPlayers.includes(participant) || mipPlayers[mipIndex] === participant).map((participant, idx) => (
                                        <MenuItem key={idx} value={participant}>{participant}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ))}
                        <TextField
                            label='MIPコメント'
                            type="text"
                            value={event[6]}
                            size="small"
                            fullWidth
                        />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Button 
                        variant="contained" 
                        onClick={() => handlePageChange('prev')} 
                        disabled={currentPage === 0}
                    >
                        前のページ
                    </Button>
                            <Button
                                variant="contained"
                        onClick={() => handlePageChange('next')} 
                        disabled={(currentPage + 1) >= events.length - 1}
                    >
                        次のページ
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2}} >
                    <Button variant="contained" color="primary" onClick={handleSaveEvent} disabled={isSubmitting}>
                        イベントを保存して集計
                            </Button>
                </Box>
            </Box>
        </>
    : <LoadingSpinner />
    );
};

export default EventResult;