'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CircularProgress, Grid, Table, TableBody, TableCell, TableContainer, TableRow, } from '@mui/material';
import AvatarIcon from './avatarIcon';

interface ProfileDen {
	lineProfile: Profile;
	densukeName?: string;
	trophy: boolean;
}

export default function Stats() {
	const [statsTable, setStatsTable] = useState<StatsData[]>([]);
	const [users, setUsers] = useState<string[][] | null>(null);

	const [gRanking, setGRanking] = useState<RankingData[]>([]);
	const [aRanking, setARanking] = useState<RankingData[]>([]);
	const [oRanking, setORanking] = useState<RankingData[]>([]);

	const [eventResult, setEventResult] = useState<any[][]>([]);
	const [profile, setProfile] = useState<ProfileDen | null>(null);
	// const [loading, setLoading] = useState(false);
	// const [result, setResult] = useState('');
	const { liff } = useLiff();

	if (liff) {
		liff.ready.then(() => {
			if (!liff.isLoggedIn()) {
				liff.login({ redirectUri: window.location.href });
			}
		})
	}

	useEffect(() => {
		console.log("Liff login (register page)");
		if (liff?.isLoggedIn()) {
			(async () => {
				const prof = await liff.getProfile();
				if (prof) {
					const profDen = { lineProfile: prof, densukeName: '', trophy: false };
					setProfile(profDen);
				}
			})();
		}
	}, [liff]);

	useEffect(() => {
		fetchData();
	}, []);


	useEffect(() => {
		if (users && profile && !profile?.densukeName) {
			const densukeName = users.find(item => item[2] === profile?.lineProfile.userId)?.[1];
			setProfile(prevProfile => prevProfile ? { ...prevProfile, densukeName: densukeName } : null);
			console.log("densuke:" + densukeName);
		}
	}, [users, profile]);

	useEffect(() => {
		if (eventResult?.length > 0 && profile?.lineProfile && statsTable.length === 0) {
			const yourResult = eventResult.find(item => item[0] === profile.lineProfile.userId);
			console.log(yourResult);
			if (yourResult) {
				let statsTable: StatsData[] = [
					createData('試合参加数', yourResult[2] + '/'+yourResult[11]+'回'),
					createData('通算ゴール数', yourResult[5] + '回'),
					createData('通算アシスト数', yourResult[6] + '回'),
					createData('得点王ランキング', yourResult[12] + '位'),
					createData('アシスト王ランキング', yourResult[13] + '位'),
					createData('岡本カップランキング', yourResult[14] + '位'),
					createData('岡本カップ成績', ''),
					createData('1位獲得数', yourResult[9] + '回'),
					createData('最下位獲得数', yourResult[10] + '回'),
					createData('チーム獲得ポイント', yourResult[8] + 'pt'),
				];
				setStatsTable(statsTable);
				const showTrophy: boolean = yourResult[15] === 1;
				setProfile(prevProfile => prevProfile ? { ...prevProfile, trophy: showTrophy } : null);
			}

		}
	}, [eventResult, profile]);

	const genarateRanking = (rankList: any[][], lang: string, users: any[][], ten: string): RankingData[] => {
		let rankTable: RankingData[] = [];
		for (const rankRow of rankList) {
			if (rankRow[0] === '' || rankRow[0] === '伝助名称' || rankRow[1] > 5 || rankRow[3] == 0) {
				continue;
			}
			let rank: RankingData = createRanking(
				chooseMedal(rankRow[1]),
				translatePlace(rankRow[1], lang),
				users.find(item => item[1] === rankRow[0])?.[4],
				rankRow[0],
				rankRow[3] + ten,
				rankingArrow(rankRow[1], rankRow[2])
			);
			rankTable.push(rank);
		}

		return rankTable;
	}

	const chooseMedal = (place: number): string => {
		if (place === 1) {
			return 'https://lh3.googleusercontent.com/d/1ishdfKxuj1fuz7kU6HOZ0NXh7jrZAr0H';
		} else if (place === 2) {
			return 'https://lh3.googleusercontent.com/d/1KKI0m8X3iR6nk1KC0eLbMHvY3QgWxUjz';
		} else if (place === 3) {
			return 'https://lh3.googleusercontent.com/d/1iqWrPdjUDe66MguqAjAiR08pYEAFL-u4';
		} else {
			return 'https://lh3.googleusercontent.com/d/1wMh5Ofoxq89EBIuijDhM-CG52kzUwP1g';
		}
	}

	const translatePlace = (place: string, lang: string): string => {
		if (place === '1') {
			return lang !== 'ja' ? '1st' : '1位';
		} else if (place === '2') {
			return lang !== 'ja' ? '2nd' : '2位';
		} else if (place === '3') {
			return lang !== 'ja' ? '3rd' : '3位';
		} else {
			return lang !== 'ja' ? place + 'th' : place + '位';
		}
	}

	const rankingArrow = (place: number, past: number): string => {
		if (!past) {
			return 'https://lh3.googleusercontent.com/d/1KsKJg9LNZOS0pMGq4Yqzv10ZfBGDsEKB';
		} else if (place < past) {
			return 'https://lh3.googleusercontent.com/d/1h8FcN6ESmMc4gKKGpRvi2x3Nk_ss9eIZ';
		} else if (place > past) {
			return 'https://lh3.googleusercontent.com/d/1fmHGmCjYTlmEoElnh-S441K3r0zmoCXt';
		} else if (place === past) {
			return 'https://lh3.googleusercontent.com/d/1KjbGAgb9Cid7Osoj7UZwY-V8fp5or5sa';
		}
		return '';
	}

	const fetchData = async () => {
		try {
			const url = process.env.SERVER_URL + `?func=getStats&func=getUsers&func=getRanking`;
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log(data);
				setUsers(data.users);
				setEventResult(data.stats);
				setGRanking(genarateRanking(data.gRank, 'ja', data.users, '点'));
				setARanking(genarateRanking(data.aRank, 'ja', data.users, '点'));
				setORanking(genarateRanking(data.oRank, 'ja', data.users, 'pt'));
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	type StatsData = {
		title: string,
		data: string,
	};

	type RankingData = {
		medalUrl: string,
		place: string,
		facePic: string,
		name: string,
		score: string,
		arrow: string
	};

	function createRanking(medalUrl: string, place: string, facePic: string, name: string, score: string, arrow: string): RankingData {
		return { medalUrl, place, facePic, name, score, arrow };
	}

	function createData(
		title: string,
		data: string,
	): StatsData {
		return { title, data };
	}

	return (
		<>
			{eventResult && eventResult.length > 0 && profile ? (
				<>
					<Grid container spacing={2} >
						{statsTable.length > 0 && (
							<Grid item sx={{ width: '100%' }} >
								<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
									<CardHeader
										sx={{
											backgroundImage: 'url(https://lh3.googleusercontent.com/d/1hS24zXApgUabcss_3ciewfg64qMti_hT)',
											backgroundSize: 'cover',
											backgroundPosition: 'center',
											height: '150px',
										}}
									/>
									<CardHeader
										avatar={
											<AvatarIcon picUrl={profile.lineProfile.pictureUrl} name={profile.lineProfile.displayName} width={56} height={56}></AvatarIcon>
										}
										title={
											<>
												<div style={{ display: 'flex', alignItems: 'center' , width:'100%'}}>
													{profile.densukeName}
													<img
														src="https://lh3.googleusercontent.com/d/1fAy83HzkttX06Vm-wt5oRPWlB-JOWcC0"
														alt="small photo"
														style={{
															visibility: profile.trophy ? 'visible' : 'hidden',
															marginLeft: '30px',
															width: '10%',
															height: '10%',
															borderRadius: '50%'
														}}
													/>
												</div>
											</>
										}
										sx={{
											padding: '0px 15px', // パディングを追加
										}}
									/>
									<CardContent>
										<TableContainer>
											<Table sx={{ width: '100%' }} size="small" aria-label="simple table">
												<TableBody>
													{statsTable.map((row) => {
														if (row.data !== '') {
															return (
																<TableRow
																	key={row.title}
																	sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
																>
																	<TableCell component="th" scope="row">
																		{row.title}
																	</TableCell>
																	<TableCell align="right">{row.data}</TableCell>
																</TableRow>
															);
														} else {
															return (
																<TableRow key={row.title}>
																	<TableCell align="center" colSpan={2}>
																		{row.title}
																	</TableCell>
																</TableRow>
															);
														}
													})}
												</TableBody>
											</Table>
										</TableContainer>
									</CardContent>
								</Card>
							</Grid>
						)}
						<Grid item sx={{ width: '100%' }} >
							<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
								<CardHeader
									sx={{
										backgroundImage: 'url(https://lh3.googleusercontent.com/d/17zIme0aExyAlixjWapLwoIW1PyWN4lbs)',
										backgroundSize: 'cover',
										backgroundPosition: 'center',
										height: '150px',
									}}
								/>
								<CardContent>
									<TableContainer>
										<Table sx={{ width: '100%' }} size="small" aria-label="simple table">
											<TableBody>
												{gRanking.map((row) => {
													return (
														<TableRow
															key={row.name}
															sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
														>
															<TableCell sx={{ padding: '3px 6px' }} component="th" scope="row">
																<img
																	src={row.medalUrl}
																	alt="trophy"
																	style={{
																		// marginLeft: '30px',
																		width: '18px',
																		height: '24px',
																	}}
																/>
															</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >{row.place}</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >
																<AvatarIcon picUrl={row.facePic} name={row.name} width={28} height={28}></AvatarIcon>
															</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >{row.name}</TableCell>
															<TableCell align="right" sx={{ padding: '3px 6px' }} >{row.score}</TableCell>
															<TableCell component="th" scope="row" sx={{ padding: '3px 6px' }} >
																<img
																	src={row.arrow}
																	alt="arrow"
																	style={{
																		// marginLeft: '30px',
																		width: '24px',
																		height: '24px',
																	}}
																/>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							</Card>
						</Grid>
						<Grid item sx={{ width: '100%' }} >
							<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
								<CardHeader
									sx={{
										backgroundImage: 'url(https://lh3.googleusercontent.com/d/1yQjFWp8t1RwrfyeqDc1pOHHpMo7u1lH8)',
										backgroundSize: 'cover',
										backgroundPosition: 'center',
										height: '150px',
									}}
								/>
								<CardContent>
									<TableContainer>
										<Table sx={{ width: '100%' }} size="small" aria-label="simple table">
											<TableBody>
												{aRanking.map((row) => {
													return (
														<TableRow
															key={row.name}
															sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
														>
															<TableCell sx={{ padding: '3px 6px' }} component="th" scope="row">
																<img
																	src={row.medalUrl}
																	alt="medal"
																	style={{
																		// marginLeft: '30px',
																		width: '18`px',
																		height: '24px',
																	}}
																/>
															</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >{row.place}</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >
																<AvatarIcon picUrl={row.facePic} name={row.name} width={28} height={28}></AvatarIcon>
															</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >{row.name}</TableCell>
															<TableCell align="right" sx={{ padding: '3px 6px' }} >{row.score}</TableCell>
															<TableCell component="th" scope="row" sx={{ padding: '3px 6px' }} >
																<img
																	src={row.arrow}
																	alt="arrow"
																	style={{
																		// marginLeft: '30px',
																		width: '24px',
																		height: '24px',
																	}}
																/>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							</Card>
						</Grid>
						<Grid item sx={{ width: '100%' }} >
							<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
								<CardHeader
									sx={{
										backgroundImage: 'url(https://lh3.googleusercontent.com/d/1BK5jLSUtJWTYXaElQyr47M2sp7chD-JW)',
										backgroundSize: 'cover',
										backgroundPosition: 'center',
										height: '150px',
									}}
								/>
								<CardContent>
									<TableContainer>
										<Table sx={{ width: '100%' }} size="small" aria-label="simple table">
											<TableBody>
												{oRanking.map((row) => {
													return (
														<TableRow
															key={row.name}
															sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
														>
															<TableCell sx={{ padding: '3px 6px' }} component="th" scope="row">
																<img
																	src={row.medalUrl}
																	alt="medal"
																	style={{
																		// marginLeft: '30px',
																		width: '18px',
																		height: '24px',
																	}}
																/>
															</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >{row.place}</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >
																<AvatarIcon picUrl={row.facePic} name={row.name} width={28} height={28}></AvatarIcon>
															</TableCell>
															<TableCell align="left" sx={{ padding: '3px 6px' }} >{row.name}</TableCell>
															<TableCell align="right" sx={{ padding: '3px 6px' }} >{row.score}</TableCell>
															<TableCell component="th" scope="row" sx={{ padding: '3px 6px' }} >
																<img
																	src={row.arrow}
																	alt="arrow"
																	style={{
																		// marginLeft: '30px',
																		width: '24px',
																		height: '24px',
																	}}
																/>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</>
			) : (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
					<div>Loading... </div>
					<CircularProgress />
				</div>
			)}
		</>
	);
}