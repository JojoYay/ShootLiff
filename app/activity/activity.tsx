'use client';
import { useEffect, useState } from 'react';

import { Avatar, Card, CardActionArea, CardContent, CircularProgress, Grid, Pagination, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import VideoCardPlus from './videoCardPlus';
import VideoCard from '../video/videoCard';
import AvatarIcon from '../stats/avatarIcon';

export default function Video() {
	useEffect(() => {
		fetchVideo();
	}, []);

	const [videos, setVideos] = useState<string[][] | null>(null);
	const [actDates, setActDates] = useState<string[] | null>(null);
	const [events, setEvents] = useState<string[][] | null>(null);
	const [shootLog, setShootLog] = useState<string[][] | null>(null);//１回分のみ（毎回ロードする必要がある）

	const [actDate, setActDate] = useState<string>('');
	const [event, setEvent]  = useState<string[]>([]);
	const [mipPic, setMipPic] = useState<string>('');
	const [currentPage, setCurrentPage] = useState(1);
	const [pageGroups, setPageGroups] = useState<number[]>([]); // ページグループを管理する新しいstate

	const [users, setUsers] = useState<string[][]>([]);

	const fetchVideo = async () => {
		try {
			const url = process.env.SERVER_URL + '?func=getInfoOfTheDay&func=getUsers';
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log(data.videos);
				console.log(data.actDates);
				console.log(data.shootLogs);
				console.log(data.users);
				console.log(data.events);
				setVideos(data.videos.slice(2).reverse()); // Reverse the order
				setActDates(data.actDates);
				setUsers(data.users.slice(1));
				setEvents(data.events.slice(1));
				setActDate(data.actDates[0]);
				setShootLog(data.shootLogs); // 初回ロード時にshootLogsも取得
				const matchedEvent = (data.events as string[][]).find(ev => ev[1] === data.actDates[0]); // actDateとマッチするイベントを検索
				setEvent(matchedEvent ? matchedEvent : []); // マッチしたイベントを設定
				console.log(matchedEvent);
				if(matchedEvent){
					const matchedUser = (data.users.slice(1) as string[][]).find(user => user[1] === matchedEvent[5]);
					setMipPic(matchedUser ? matchedUser[4] : '');
					console.log(matchedUser);
				}
				console.log("initialLoading done");
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		if (actDate && events && users) {
			// console.log(actDate);
			// videosの最初の要素が変わるごとにページを区切るためのindexを計算
			const actDateIndex = (actDates as string[]).indexOf(actDate);
			const matchedEvent = events[actDateIndex];
			setEvent(matchedEvent); // マッチしたイベントを設定
			console.log(matchedEvent);
			if(matchedEvent){
				const matchedUser = (users as string[][]).find(user => user[1] === matchedEvent[5]);
				setMipPic(matchedUser ? matchedUser[4] : '');
				console.log(matchedUser);
			}
		}
	}, [actDate]);

	const fetchShootLog = async (actDate: string) => {
		try {
			const url = process.env.SERVER_URL + '?func=getInfoOfTheDay&actDate=' + actDate;
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log("shoot log",data.shootLogs);
				setShootLog(data.shootLogs); // shootLogsを更新
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};


	useEffect(() => {
		if (videos) {
			// videosの最初の要素が変わるごとにページを区切るためのindexを計算
			const groups: number[] = [];
			if (videos.length > 0) {
				groups.push(0); // 最初の要素を常に含める
				for (let i = 1; i < videos.length; i++) {
					if (videos[i][0] !== videos[i - 1][0]) {
						groups.push(i); // 要素が変わるindexを記録
					}
				}
			}
			setPageGroups(groups);
		}
	}, [videos]);

	const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
		setCurrentPage(value);
		if(actDates){
			const targetActDate = actDates[value - 1]; // pageGroupsからactDatesのindexを取得
			console.log('targetActDate', targetActDate);
			setActDate(targetActDate);
			await fetchShootLog(targetActDate); // actDateを指定してfetchShootLogを呼び出す
		}
	};

	// 現在のページの動画をpageGroupsから計算
	const startIndex = pageGroups[currentPage - 1] || 0;
	const endIndex = pageGroups[currentPage] || videos?.length || 0;
	const currentItems = videos 
    ? videos.slice(startIndex, endIndex).sort((a, b) => {
        // _gで始まるものを最前列に
        const aIsG = a[0].startsWith('_g'); // ここで適切なインデックスを指定
        const bIsG = b[0].startsWith('_g'); // ここで適切なインデックスを指定

        if (aIsG && !bIsG) return -1; // aが_gで始まる場合
        if (!aIsG && bIsG) return 1;  // bが_gで始まる場合

        // それ以外の順序は昇順でソート
        return a[1].localeCompare(b[1]); // index 1で昇順にソート
    }) 
    : [];

	return (
		<>
			{(videos && events && actDates) ?  (
					<>
						<div style={{ textAlign: 'center', margin: '20px 0' }}>
							<Typography variant="h4" style={{ fontWeight: 'bold', color: '#333' }}>
								{event[1]} 
							</Typography>
						</div>
						<Table size="small" sx={{ borderCollapse: 'collapse' }}> {/* テーブル全体のボーダーをcollapseで制御 */}
							< TableHead sx={{ borderBottom: 'none' }}> {/* TableHeadの下線 */}
								< TableRow sx={{ borderBottom: 'none' }}> {/* TableRowの下線 */}
									<TableCell align="center" sx={{ borderBottom: 'none' }}>本日のMIP</TableCell> {/* TableCellの下線 */}
								</TableRow>
							</TableHead>
							< TableBody sx={{ borderBottom: 'none' }}> {/* TableBodyの下線 */}
								< TableRow sx={{ borderBottom: 'none' }}>
									<TableCell align="center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: 'none' }}> {/* TableCellの下線 */}
										<AvatarIcon picUrl={mipPic} name={event[5]} width={56} height={56}></AvatarIcon>
										<Typography variant="caption" style={{ padding: '3px', fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
											{event[5]}
										</Typography>
									</TableCell>
								</TableRow>
								< TableRow sx={{ borderBottom: 'none' }}> {/* TableRowの下線 */}
									<TableCell align="center" sx={{ borderBottom: 'none' }}> {/* TableCellの下線 */}
										<Typography variant="caption" style={{ padding: '3px', fontWeight: 'bold', color: '#333' }}>
										{event[6]}
										</Typography>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>

						<Grid container spacing={2} style={{ margin: '5px', width:'100%' }}>
						{currentItems.map((data, index) => (
								<div key={index}>
									{shootLog ? (
										<VideoCardPlus 
											url={data[2]} 
											title={data[1]}
											team1Name={data[3]} 
											team2Name={data[4]} 
											team1Member={data[5]} 
											team2Member={data[6]} 
											team1Score={data[7]} 
											team2Score={data[8]} 
											winTeam={data[9]} 
											matchId={data[10]}
											shootLog={shootLog} 
											users={users}
										/>
									) : (
										<VideoCard 
											url={data[2]} 
											title={data[1]} 
											date={data[0]} 
										/>
									)}
								</div>
							))}
						</Grid>
						<Pagination
							count={pageGroups.length} // ページ数をpageGroupsの長さに変更
							page={currentPage}
							onChange={handlePageChange}
							style={{ display: 'flex', justifyContent: 'center', margin: '20px' }}
						/>
					</>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
					<div>Loading...</div>
					<style>
					{`
						@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
						}
					`}
					</style>
					<img
					src="https://lh3.googleusercontent.com/d/1Qc2YASdbIoikuT5bNcdnObhznf-WD5rK"
					alt="ローディング画像"
					style={{
						width: '50px',  // サイズ調整
						height: '50px', // サイズ調整
						borderRadius: '50%', // 画像を丸くする
						animation: 'spin 2s linear infinite', // アニメーション
					}}
					/>
				</div>
			)}
		</>
	);
}