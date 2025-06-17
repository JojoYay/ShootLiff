'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, Box, Table, TableBody, TableCell, TableContainer, TableRow, Button, Dialog, DialogContent, CircularProgress, Typography } from '@mui/material';
import AvatarIcon from './avatarIcon';
import LoadingSpinner from '../calendar/loadingSpinner';
import { toJpeg } from 'html-to-image';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ProfileDen {
	lineProfile: Profile;
	densukeName?: string;
	trophy: boolean;
}

export default function Stats() {
	
	const [statsTable, setStatsTable] = useState<StatsData[]>([]);
	const [users, setUsers] = useState<string[][] | null>(null);

	const [lang, setLang] = useState<string>('ja-JP');
	const [gRanking, setGRanking] = useState<RankingData[]>([]);
	const [aRanking, setARanking] = useState<RankingData[]>([]);
	const [oRanking, setORanking] = useState<RankingData[]>([]);
	const [attRanking, setAttRanking] = useState<RankingData[]>([]);

	const [eventResult, setEventResult] = useState<any[][]>([]);
	const [profile, setProfile] = useState<ProfileDen | null>(null);
	const { liff } = useLiff();
	const pdfRef = useRef<HTMLDivElement>(null);
	const [isImageLoading, setIsImageLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

    useEffect(() => {
        if (liff) {
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    if (profile) {
                        const profDen = { lineProfile: profile, densukeName: '', trophy: false };
                        setProfile(profDen);
                    }
                    setLang(liff.getLanguage());
                });
            }
        }
    }, [liff]);

	useEffect(() => {
		fetchData();
	}, [lang]);

	useEffect(() => {
		if (users && profile && !profile?.densukeName) {
			const densukeName = users.find(item => item[2] === profile?.lineProfile.userId)?.[1];
			setProfile(prevProfile => prevProfile ? { ...prevProfile, densukeName: densukeName } : null);
			// console.log("densuke:" + densukeName);
		}
	}, [users, profile]);

	const calculateAge = (birthDateString:string) => {
		if(birthDateString){
			const birthDate = new Date(birthDateString);
			const today = new Date();
		
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDifference = today.getMonth() - birthDate.getMonth();
		
			// 誕生日がまだ来ていない場合は1歳減らす
			if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}
		
			return age.toString();
		}
		return "";
	};

	type FootOptions = 'Right' | 'Left' | 'Both';
	type PositionOptions = 'Forward' | 'Midfielder' | 'Defender' | 'Anything!';
	type RatingOptions = '1st Tier' | '2nd Tier' | '3rd Tier' | '4th Tier';
	type BirthplaceOptions = 'East Side' | 'West Side' | 'Others' | 'Secret';
	
	const optionMap = {
		foot: {
			Right: '右',
			Left: '左',
			Both: '両方',
		},
		position: {
			Forward: 'フォワード',
			Midfielder: 'ミッドフィルダー',
			Defender: 'ディフェンダー',
			'Anything!': 'なんでも',
		},
		rating: {
			'1st Tier': '1st Tier',
			'2nd Tier': '2nd Tier',
			'3rd Tier': '3rd Tier',
			'4th Tier': '4th Tier',
		},
		birthplace: {
			'East Side': '関東',
			'West Side': '関西',
			Others: 'その他',
			Secret: '秘密',
		},
	};
	
	const formatDateToSingaporeTime = (dateString: string) => {
		if(dateString){
			const date = new Date(dateString);
			// UTCから8時間進める
			date.setHours(date.getHours() + 8);
			return date.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換
		}
		return '';
	};

	useEffect(() => {
		// console.log("line profile name"+profile?.lineProfile.displayName+" statsTable "+statsTable+" eventrResult "+eventResult);
		if (eventResult?.length > 0 && profile?.lineProfile && statsTable.length === 0 && users) {
			const yourResult = eventResult.find(item => item[0] === profile.lineProfile.userId);
			const userInfo:string[] = users.find(user => user[2] === profile.lineProfile.userId) || [];
			// console.log("loadProfile:"+yourResult);
			if (yourResult) {
				const nextGoalRow = eventResult.find(item => item[12] === (yourResult[12]-1));
				const nextAssistRow = eventResult.find(item => item[13] === (yourResult[13]-1));
				const nextOkamotoRow = eventResult.find(item => item[14] === (yourResult[14]-1));
				let nextGoal = !nextGoalRow ? '--' : nextGoalRow[5] - yourResult[5];
				let nextAssist = !nextAssistRow ? '--' : nextAssistRow[6] - yourResult[6];
				let nextOkamoto = !nextOkamotoRow ? '--' : nextOkamotoRow[8] - yourResult[8] +1;

				const statsTitle = lang === 'ja-JP' ? '戦績':"Stats";
				const siaisanka = lang === 'ja-JP' ? '試合参加数':"No. of Matches";
				const totalGoals = lang === 'ja-JP' ? '通算ゴール数':"Toal Goals";
				const totalAssists = lang === 'ja-JP' ? '通算アシスト数':"Total Assists";
				const goalRanking = lang === 'ja-JP' ? '得点王ランキング':"Top Scorer Ranking";
				const assistRanking = lang === 'ja-JP' ? 'アシスト王ランキング':"Assist King Ranking";
				const okamotoRanking = lang === 'ja-JP' ? '岡本カップランキング':"Okamoto Cup Ranking";
				const okamotoCupDetail = lang === 'ja-JP' ? '岡本カップ詳細':"Okamoto Cup Result";
				const ichii = lang === 'ja-JP' ? '1位獲得数':"1st Place";
				const biri = lang === 'ja-JP' ? '最下位獲得数':"Last Place";
				const okamotoCupResult = lang === 'ja-JP' ? '岡本カップポイント':"Okamoto Point";
				// const nextRankup = lang === 'ja-JP' ? '次のランクアップまで':"Next Rank Up";
				// const tokuten = lang === 'ja-JP' ? '得点':"Goals";
				// const assist = lang === 'ja-JP' ? 'アシスト':"Assists";
				// const okamotoPoint = lang === 'ja-JP' ? '岡本ポイント':"Okamoto Point";
				const kai =  lang === 'ja-JP' ? '回':"";
				const ten =  lang === 'ja-JP' ? '点':"";
				const ee =   lang === 'ja-JP' ? '位':"";

				const baseInfo = lang === 'ja-JP' ? '基本情報':"Profile";
				const tier = lang === 'ja-JP' ? 'Tier':"Tier";
				const position = lang === 'ja-JP' ? 'ポジション':"Position";
				const kiki = lang === 'ja-JP' ? '利き足':"Foot Preference";
				const birthDay = lang === 'ja-JP' ? '誕生日':"Birthday";
				const age = lang === 'ja-JP' ? '年齢':"Age";
				const birthplace = lang === 'ja-JP' ? '出身':"BirthPlace";

				const footKey: FootOptions | undefined = userInfo[6] as FootOptions | undefined;
				const positionKey: PositionOptions | undefined = userInfo[7] as PositionOptions | undefined;
				const tierKey: RatingOptions | undefined = userInfo[8] as RatingOptions | undefined;
				const birthPlaceKey: BirthplaceOptions | undefined = userInfo[10] as BirthplaceOptions | undefined;

				let statsTable: StatsData[] = [
					// createData(statsTitle, ''),
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
					// createData(nextRankup,''),
					// createData(tokuten,nextGoal+ten),
					// createData(assist,nextAssist+kai),
					// createData(okamotoPoint,nextOkamoto+'pt'),
					createData(baseInfo, ""),
					createData((userInfo && userInfo[9]) ? age: '', (userInfo && userInfo[9]) ? calculateAge(userInfo[9]) : ''),
					createData(birthDay, formatDateToSingaporeTime(userInfo[9])),
					createData(position, lang === 'ja-JP' ? positionKey ? optionMap.position[positionKey] : '' : userInfo[7]),
					createData(tier, lang === 'ja-JP' ? tierKey ? optionMap.rating[tierKey] : '' : userInfo[8]),
					createData(kiki, lang === 'ja-JP' ? footKey ? optionMap.foot[footKey] : '' : userInfo[6]),
					createData(birthplace, lang === 'ja-JP' ? birthPlaceKey ? optionMap.birthplace[birthPlaceKey] : '' : userInfo[10]),
					];
				statsTable = statsTable.filter((row, index) => {
					if(index === 0 || index === 11){
						return true;
					}
					const data = row.data; // 各行のデータを取得
					return data !== '' && data !== undefined; // 空でない行だけを残す
				});
				if(statsTable.length===11){
					statsTable = statsTable.slice(0, -1);
				}
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
			// console.log("lang "+lang);
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

	const generateAttendanceRanking = (stats: any[][], users: any[][]): RankingData[] => {
		let rankTable: RankingData[] = [];
		if (!stats || !users) {
			return rankTable;
		}

		const attendanceData = stats.map(statRow => {
			const userId = statRow[0];
			const attendanceCount = parseInt(statRow[2], 10); // 3列目が出席数
			const user = users.find(u => u[2] === userId);
			if (user) {
				return {
					userId: userId,
					name: user[1], // 伝助名称
					facePic: user[4], // 顔写真URL
					attendanceCount: attendanceCount,
				};
			}
			return null;
		}).filter(item => item !== null && item.name !== '伝助名称' && item.attendanceCount > 0) as { userId: string; name: string; facePic: string; attendanceCount: number }[]; // nullを除去し、型を明確にする

		// 出席数で降順ソート
		attendanceData.sort((a, b) => b.attendanceCount - a.attendanceCount);

		rankTable = attendanceData.map((data, index) => {
			const place = index + 1;
			return createRanking(
				chooseMedal(place), // 順位に応じたメダル
				translatePlace(place.toString(), lang), // 順位を文字列に変換
				data.facePic,
				data.name,
				data.attendanceCount.toString() + (lang === 'ja-JP' ? '回' : ''), // スコア（出席回数）
				'' // 矢印はなし
			);
		});

		return rankTable;
	};

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
		if (place.toString() === '1') {
			return lang !== 'ja-JP' ? '1st' : '1位';
		} else if (place.toString() === '2') {
			return lang !== 'ja-JP' ? '2nd' : '2位';
		} else if (place.toString() === '3') {
			return lang !== 'ja-JP' ? '3rd' : '3位';
		} else {
			return lang !== 'ja-JP' ? place + 'th' : place + '位';
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
				const kai =  lang === 'ja-JP' ? '回':"";
				const ten =  lang === 'ja-JP' ? '点':"";

				setGRanking(genarateRanking(data.gRank, data.users, ten));
				setARanking(genarateRanking(data.aRank, data.users, kai));
				setORanking(genarateRanking(data.oRank, data.users, 'pt'));
				setAttRanking(generateAttendanceRanking(data.stats, data.users));

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

	const handleRankingIconClick = (densukeName: string) => {
		if (users) {
			const userData = users.find(item => item[1] === densukeName);
			if (userData) {
				
				const lineProfile = { userId: userData[2], displayName: userData[1], pictureUrl: userData[4], language: lang } as Profile;
				const yourResult = eventResult.find(item => item[0] === userData[2]);
				let trophy:boolean = false;
				if(yourResult){
					trophy = !!yourResult[15];
				}
				const profDen: ProfileDen = { lineProfile: lineProfile, densukeName: densukeName, trophy: trophy };
				setProfile(profDen);
				setStatsTable([]);
				window.scrollTo({ top: 0, behavior: 'smooth' }); 
			} else {
				// console.log("User not found:", densukeName);
			}
		}
	};

	const handleCopyUrl = async () => {
		if (imageUrl) {
			try {
				await navigator.clipboard.writeText(imageUrl);
				alert(lang === 'ja-JP' ? 'URLをコピーしました。デフォルトブラウザで開いて保存して下さい。' : 'URL copied. Please open it in your default browser to save.');
			} catch (error) {
				console.error('URLのコピーに失敗しました:', error);
				alert(lang === 'ja-JP' ? 'URLのコピーに失敗しました' : 'Failed to copy URL');
			}
		}
	};

	const handleDownloadImage = async () => {
		if (pdfRef.current) {
			try {
				setIsImageLoading(true);
				const dataUrl = await toJpeg(pdfRef.current, {
					quality: 0.8,
					pixelRatio: 1.0,
					backgroundColor: '#ffffff',
					filter: (node) => {
						return true;
					}
				});

				if (dataUrl) {
					setImageUrl(dataUrl);
					setIsImageDialogOpen(true);
				}
			} catch (error) {
				console.error('画像生成エラー:', error);
				alert(lang === 'ja-JP' ? '画像の生成に失敗しました。もう一度お試しください。' : 'Failed to generate image. Please try again.');
			} finally {
				setIsImageLoading(false);
			}
		}
	};

	const handleCloseImageDialog = () => {
		setIsImageDialogOpen(false);
		setImageUrl(null);
	};

	return (
		<>
			{eventResult && eventResult.length > 0 && profile ? (
				<>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
						<Button 
							variant="contained" 
							color="primary" 
							onClick={handleDownloadImage}
							sx={{ 
								backgroundColor: '#2e7d32',
								'&:hover': {
									backgroundColor: '#1b5e20',
								}
							}}
						>
							{lang === 'ja-JP' ? '画像形式でダウンロード' : 'Download as Image'}
						</Button>
					</Box>

					{/* ローディングモーダル */}
					<Dialog
						open={isImageLoading}
						PaperProps={{
							style: {
								backgroundColor: 'transparent',
								boxShadow: 'none',
							},
						}}
					>
						<DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
							<CircularProgress sx={{ color: '#2e7d32' }} />
						</DialogContent>
					</Dialog>

					{/* 画像表示モーダル */}
					<Dialog
						open={isImageDialogOpen}
						onClose={handleCloseImageDialog}
						maxWidth="md"
						fullWidth
					>
						<DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							{imageUrl && (
								<>
									<Box sx={{ 
										mb: 2, 
										p: 2, 
										bgcolor: '#f5f5f5', 
										borderRadius: 1,
										width: '100%',
										textAlign: 'center'
									}}>
										<Typography variant="body1" sx={{ mb: 2 }}>
											{lang === 'ja-JP' ? 'URLをコピーしてデフォルトブラウザで開いて保存して下さい' : 'Copy the URL and open it in your default browser to save'}
										</Typography>
										<Button
											variant="contained"
											startIcon={<ContentCopyIcon />}
											onClick={handleCopyUrl}
											sx={{
												backgroundColor: '#2e7d32',
												'&:hover': {
													backgroundColor: '#1b5e20',
												}
											}}
										>
											{lang === 'ja-JP' ? 'URLをコピー' : 'Copy URL'}
										</Button>
									</Box>
									<img
										src={imageUrl}
										alt="Stats"
										style={{
											maxWidth: '100%',
											height: 'auto',
											boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
										}}
									/>
								</>
							)}
						</DialogContent>
					</Dialog>

					<div ref={pdfRef}>
						{statsTable.length > 0 && (
							<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
								<CardHeader
									title={
										<>
											<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
												<div>STATS</div>
												<div style={{ 
													fontSize: '1rem', 
													color: 'rgba(255, 255, 200, 0.7)',
													marginTop: '0.5rem'
												}}>
													{new Date().toLocaleDateString(lang === 'ja-JP' ? 'ja-JP' : 'en-US', {
														year: 'numeric',
														month: 'long',
														day: 'numeric'
													})}
												</div>
											</div>
										</>
									}
									titleTypographyProps={{
										sx: {
											color: 'rgba(255, 255, 200, 0.7)',
											fontSize: '3rem',
											fontWeight: 'bold',
											position: 'absolute',
											top: '50%',
											left: '50%',
											transform: 'translate(-50%, -50%)',
											zIndex: 1
										}
									}}
									sx={{
										backgroundColor: '#2e7d32',
										height: '60px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										borderBottom: '2px solid #1b5e20',
										backgroundImage: 'url(https://lh3.googleusercontent.com/d/1WDW538XmRe68fwtYOKQcd7QF2ta-Av4E)',
										backgroundSize: 'cover',
										backgroundPosition: 'center',
										position: 'relative'
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
														if(row.title !== ''){
															return (
																<TableRow key={row.title}>
																	<TableCell align="center" colSpan={2}>
																		{row.title}
																	</TableCell>
																</TableRow>
															);
														}
													}
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							</Card>
						)}
						<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
							<CardHeader
								title={'SCORE'}
								titleTypographyProps={{
									sx: {
										color: 'rgba(255, 255, 200, 0.7)',
										fontSize: '3rem',
										fontWeight: 'bold',
										position: 'absolute',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
										zIndex: 1
									}
								}}
								sx={{
									backgroundColor: '#2e7d32',
									height: '60px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderBottom: '2px solid #1b5e20',
									backgroundImage: 'url(https://lh3.googleusercontent.com/d/1WDW538XmRe68fwtYOKQcd7QF2ta-Av4E)',
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									position: 'relative'
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
														onClick={() => handleRankingIconClick(row.name)}
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
						<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
							<CardHeader
								title={'ASSIST'}
								titleTypographyProps={{
									sx: {
										color: 'rgba(255, 255, 200, 0.7)',
										fontSize: '3rem',
										fontWeight: 'bold',
										position: 'absolute',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
										zIndex: 1
									}
								}}
								sx={{
									backgroundColor: '#2e7d32',
									height: '60px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderBottom: '2px solid #1b5e20',
									backgroundImage: 'url(https://lh3.googleusercontent.com/d/1WDW538XmRe68fwtYOKQcd7QF2ta-Av4E)',
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									position: 'relative'
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
														onClick={() => handleRankingIconClick(row.name)}
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
						<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
							{/* <CardHeader
								sx={{
									backgroundImage: 'url(https://lh3.googleusercontent.com/d/1BK5jLSUtJWTYXaElQyr47M2sp7chD-JW)',
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									height: '150px',
								}}
							/> */}
							<CardHeader
								title={'OKAMOTO'}
								titleTypographyProps={{
									sx: {
										color: 'rgba(255, 255, 200, 0.7)',
										fontSize: '3rem',
										fontWeight: 'bold',
										position: 'absolute',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
										zIndex: 1
									}
								}}
								sx={{
									backgroundColor: '#2e7d32',
									height: '60px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderBottom: '2px solid #1b5e20',
									backgroundImage: 'url(https://lh3.googleusercontent.com/d/1WDW538XmRe68fwtYOKQcd7QF2ta-Av4E)',
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									position: 'relative'
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
														onClick={() => handleRankingIconClick(row.name)}
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
						<Card sx={{ width: '100%', display: 'inline-block', '@media (min-width: 600px)': { display: 'inline-block' } }}>
							<CardHeader
								title={'ATTENDANCE'}
								titleTypographyProps={{
									sx: {
										color: 'rgba(255, 255, 200, 0.7)',
										fontSize: '3rem',
										fontWeight: 'bold',
										position: 'absolute',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
										zIndex: 1
									}
								}}
								sx={{
									backgroundColor: '#2e7d32',
									height: '60px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderBottom: '2px solid #1b5e20',
									backgroundImage: 'url(https://lh3.googleusercontent.com/d/1WDW538XmRe68fwtYOKQcd7QF2ta-Av4E)',
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									position: 'relative'
								}}
							/>
							<CardContent>
								<TableContainer sx={{
									maxHeight: '65vh',  // ビューポートの高さの60%
									overflowY: 'auto'   // 縦方向のスクロールを有効化
								}}>
									<Table sx={{ width: '100%' }} size="small" aria-label="simple table">
										<TableBody>
											{attRanking.map((row) => {
												return (
													<TableRow
														key={row.name}
														sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
														onClick={() => handleRankingIconClick(row.name)}
													>
														<TableCell sx={{ padding: '3px 6px' }} component="th" scope="row">
															<img
																src={row.medalUrl}
																alt="medal"
																style={{
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
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</TableContainer>
							</CardContent>
						</Card>
					</div>
				</>
			) : (
                <LoadingSpinner />
			)}
		</>
	);
}