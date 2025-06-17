'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import LoadingSpinner from '../calendar/loadingSpinner';

export default function Registration() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<string[][]>([]);
	const [user, setUser] = useState<string[]>([]);
	const { liff } = useLiff();
    const [lang, setLang] = useState<string>('ja-JP');
	
	const footOptions = ['右', '左', '両方'];
	const footOptionsEng = ['Right', 'Left', 'Both']; // 利き足の選択肢
	
	const positionOptions = 
		['フォワード', 'ミッドフィルダー', 'ディフェンダー', 'なんでも'];
	const positionOptionsEng = 
		['Forward', 'Midfielder', 'Defender', 'Anything!']; // ポジションの選択肢
	
	const ratingOptions = ['1st Tier', '2nd Tier', '3rd Tier'];
	
	const birthplaceOptions =  
		['関東', '関西', 'その他', '秘密'];
	const birthplaceOptionsEng =  
		['East Side', 'West Side', 'Others', 'Secret']; // 出身地の選択肢
	
	const [isSaving, setIsSaving] = useState<boolean>(false);
	useEffect(() => {
		loadUsers();
	}, [profile]);

	useEffect(() => {
        if (liff) {
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    setProfile(profile);
                });
                setLang(liff.getLanguage());
            }
        }
    }, [liff]);

	const loadUsers = async () => {
        setLoading(true);
        try {
            let url = process.env.SERVER_URL + `?func=getUsers`;
            if (url && profile) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                setUsers(data.users.slice(1));
				const user2 = data.users.slice(1).find((user:string[]) => user[2] === profile.userId);
				setUser(user2);
				console.log(user2);
            }
        } catch (error) {
            alert(error);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

	// const [tempUser, setTempUser] = useState<string[]>(user); // 一時的なユーザー情報を保持

	const handleUserEdit = (index: number, newValue: string) => {
		const updatedUser = [...user];
		updatedUser[index] = newValue; // 一時的に変更を保持
		setUser(updatedUser);
	};
	
	const saveAllChanges = async () => {
		setIsSaving(true);
		try {
			const formData = new FormData();
			formData.append('func', 'updateUser');
			formData.append('LINE ID', user[2]);
			formData.append('Kikiashi', user[6]);
			formData.append('Position', user[7]);
			formData.append('SelfRating', user[8]);
			formData.append('Birthday', user[9]);
			formData.append('BirthPlace', user[10]);
						
			const response = await fetch(`${process.env.SERVER_URL}`, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
				},
				body: formData,
			});
	
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
	
			const data = await response.json();
			console.log('Update successful:', data);
			// 必要に応じて、ユーザー情報を再取得する処理を追加
		} catch (error) {
			console.error('Error updating user:', error);
			alert('ユーザー情報の更新に失敗しました。');
		} finally {
            setIsSaving(false);
        }
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

	return (
		<>
			{!loading && user.length > 0 ? (
				<>
					<Box sx={{margin:1}}>
						<TextField 
								value={user[1]} 
								disabled
								fullWidth
								label={lang === 'ja' ? '表示名称' : 'Display Name'} 
							/>
						</Box>
					<Box sx={{margin:1}}>
						<Typography variant="h6" component="div" sx={{ textAlign: 'left', mb: 1, fontWeight: 'bold' }}>
							{lang === 'ja' ? '以下の情報はチーム分けで使えたら使います。' : 'We may use those information to decide team.'}
						</Typography>
					</Box>
					<Box sx={{margin:1}}>
						<FormControl fullWidth>
							<InputLabel>{lang === 'ja' ? '利き足' : 'Foot Preference'}</InputLabel>
							<Select 
								value={user[6]} 
								onChange={(e) => handleUserEdit(6, e.target.value)} 
							>
								{footOptions.map((option, ind) => (
									<MenuItem key={option} value={footOptionsEng[ind]}>{lang==="ja-JP" ? option : footOptionsEng[ind]}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{margin:1}}>
						<FormControl fullWidth>
							<InputLabel>{lang === 'ja' ? 'ポジション' : 'Position'}</InputLabel>
							<Select 
								value={user[7]} 
								onChange={(e) => handleUserEdit(7, e.target.value)} 
							>
								{positionOptions.map((option, ind) => (
									<MenuItem key={option} value={positionOptionsEng[ind]}>{lang==="ja-JP" ? option : positionOptionsEng[ind]}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{margin:1}}>
						<FormControl fullWidth>
							<InputLabel>{lang === 'ja' ? '自己採点' : 'Self Rating'}</InputLabel>
							<Select 
								value={user[8]} 
								onChange={(e) => handleUserEdit(8, e.target.value)} 
							>
								{ratingOptions.map(option => (
									<MenuItem key={option} value={option}>{option}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{margin:1}}>
						<FormControl fullWidth>
						{/* <InputLabel>{lang === 'ja' ? '誕生日' : 'Birthday'}</InputLabel> */}
						<TextField 
							type="date" 
							label={lang === 'ja' ? '誕生日' : 'Birthday'}
							value={formatDateToSingaporeTime(user[9])} 
							onChange={(e) => handleUserEdit(9, e.target.value)} 
							InputLabelProps={{
								shrink: true,
							}}
						/>
						</FormControl>
					</Box>
					<Box sx={{margin:1}}>
						<FormControl fullWidth>
							<InputLabel>{lang === 'ja' ? '出身地' : 'Birthplace'}</InputLabel>
							<Select 
								value={user[10]} 
								onChange={(e) => handleUserEdit(10, e.target.value)} 
							>
								{birthplaceOptions.map((option, ind) => (
									<MenuItem key={option} value={birthplaceOptionsEng[ind]}>{lang==="ja-JP" ? option : birthplaceOptionsEng[ind]}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
                    <Button
						sx={{margin:1}}
						variant="contained"
						color="primary"
						onClick={saveAllChanges}
						disabled={isSaving}
						>
						{isSaving ? <CircularProgress size={24} /> : lang === 'ja-JP' ? '保存' : 'Save'}
                    </Button>
				</>
			) : (
				<LoadingSpinner />
			)}
		</>
	);
}