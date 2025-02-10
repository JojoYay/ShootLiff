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

	const [lang, setLang] = useState<string>('ja');
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
				setLang(liff?.getLanguage());
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
				const nextGoalRow = eventResult.find(item => item[12] === (yourResult[12]-1));
				const nextAssistRow = eventResult.find(item => item[13] === (yourResult[13]-1));
				const nextOkamotoRow = eventResult.find(item => item[14] === (yourResult[14]-1));
				let nextGoal = !nextGoalRow ? '--' : nextGoalRow[5] - yourResult[5];
				let nextAssist = !nextAssistRow ? '--' : nextAssistRow[6] - yourResult[6];
				let nextOkamoto = !nextOkamotoRow ? '--' : nextOkamotoRow[8] - yourResult[8] +1;

				const siaisanka = lang === 'ja' ? '試合参加数':"No. of Matches";
				const totalGoals = lang === 'ja' ? '通算ゴール数':"Toal Goals";
				const totalAssists = lang === 'ja' ? '通算アシスト数':"Total Assists";
				const goalRanking = lang === 'ja' ? '得点王ランキング':"Top Scorer Ranking";
				const assistRanking = lang === 'ja' ? 'アシスト王ランキング':"Assist King Ranking";
				const okamotoRanking = lang === 'ja' ? '岡本カップランキング':"Okamoto Cup Ranking";
				const okamotoCupDetail = lang === 'ja' ? '岡本カップ詳細':"Okamoto Cup Result";
				const ichii = lang === 'ja' ? '1位獲得数':"1st Place";
				const biri = lang === 'ja' ? '最下位獲得数':"Last Place";
				const okamotoCupResult = lang === 'ja' ? '岡本カップポイント':"Okamoto Point";
				const nextRankup = lang === 'ja' ? '次のランクアップまで':"Next Rank Up";
				const tokuten = lang === 'ja' ? '得点':"Goals";
				const assist = lang === 'ja' ? 'アシスト':"Assists";
				const okamotoPoint = lang === 'ja' ? '岡本ポイント':"Okamoto Point";
				const kai =  lang === 'ja' ? '回':"";
				const ten =  lang === 'ja' ? '点':"";
				const ee =   lang === 'ja' ? '位':"";
				
				let statsTable: StatsData[] = [
					createData(siaisanka, yourResult[2] + '/'+yourResult[11]+kai),
					createData(totalGoals, yourResult[5] + ten),
					createData(totalAssists, yourResult[6] + kai),
					createData(goalRanking, yourResult[12] + '/' + yourResult[16] + ee),
					createData(assistRanking, yourResult[13] + '/' + yourResult[17] + ee),
					createData(okamotoRanking, yourResult[14] + '/' + yourResult[18] + ee),
					createData(okamotoCupDetail, ''),
					createData(ichii, yourResult[9] + kai),
					createData(biri, yourResult[10] + kai),
					createData(okamotoCupResult, yourResult[8] + 'pt'),
					createData(nextRankup,''),
					createData(tokuten,nextGoal+ten),
					createData(assist,nextAssist+kai),
					createData(okamotoPoint,nextOkamoto+'pt')
					];
				setStatsTable(statsTable);
				const showTrophy: boolean = yourResult[15] === 1;
				setProfile(prevProfile => prevProfile ? { ...prevProfile, trophy: showTrophy } : null);
			}

		}
	}, [eventResult, profile]);

	const genarateRanking = (rankList: any[][], users: any[][], ten: string): RankingData[] => {
		let rankTable: RankingData[] = [];
		for (const rankRow of rankList) {
			if (rankRow[0] === '' || rankRow[0] === '伝助名称' || rankRow[3] == 0) {
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
				const kai =  lang === 'ja' ? '回':"";
				const ten =  lang === 'ja' ? '点':"";

				setGRanking(genarateRanking(data.gRank, data.users, ten));
				setARanking(genarateRanking(data.aRank, data.users, kai));
				setORanking(genarateRanking(data.oRank, data.users, 'pt'));
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
										<TableContainer sx={{ 
											maxHeight: '65vh',  // ビューポートの高さの60%
											overflowY: 'auto'   // 縦方向のスクロールを有効化
										}}>
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
									<TableContainer sx={{ 
											maxHeight: '65vh',  // ビューポートの高さの60%
											overflowY: 'auto'   // 縦方向のスクロールを有効化
										}}>
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
									<TableContainer sx={{ 
											maxHeight: '65vh',  // ビューポートの高さの60%
											overflowY: 'auto'   // 縦方向のスクロールを有効化
										}}>
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
									<TableContainer sx={{ 
											maxHeight: '65vh',  // ビューポートの高さの60%
											overflowY: 'auto'   // 縦方向のスクロールを有効化
										}}>
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