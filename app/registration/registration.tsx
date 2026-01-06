'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Autocomplete } from '@mui/material';
import LoadingSpinner from '../calendar/loadingSpinner';
import { JsonUser } from '../types/user';

export default function Registration() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState<JsonUser | null>(null);
	const [jsonUsers, setJsonUsers] = useState<JsonUser[]>([]);
	const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
	const { liff } = useLiff();
    const [lang, setLang] = useState<string>('ja-JP');
	
	const footOptions = ['右', '左', '両方'];
	const footOptionsEng = ['Right', 'Left', 'Both']; // 利き足の選択肢
	
	const positionOptions = 
		// ['フォワード', 'ミッドフィルダー', 'ディフェンダー', 'なんでも'];
		['センターフォワード（CF）',
		'右ウイング（RW）',
		'左ウイング（LW）',
		'トップ下（AM）',
		'センターハーフ（CM）',
		'ボランチ／(DM)',
		'右サイドハーフ（RM）',
		'左サイドハーフ（LM）',
		'センターバック（CB）',
		'右サイドバック（RB）',
		'左サイドバック（LB）',
		'ゴールキーパー（GK）',
		'わからない（決めてほしい）'];
		const positionOptionsEng = 
		// ['Forward', 'Midfielder', 'Defender', 'Anything!']; // ポジションの選択肢
		['Center Forward（CF）',
		'Right Wing（RW）',
		'Left Wing（LW）',
		'Attacking Midfielder（AM）', 
		'Center Midfielder（CM）',
		'Defensive Midfielder（DM）',
		'Right Midfielder（RM）',
		'Left Midfielder（LM）',
		'Center Back（CB）',
		'Right Side Back（RB）',
		'Left Side Back（LB）',
		'Goalkeeper（GK）',
		'Anything!'
		];
	

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

	const loadUsers = async (preserveSelection: boolean = false) => {
        setLoading(true);
        try {
            let url = process.env.NEXT_PUBLIC_SERVER_URL + `?func=getUsers`;
            if (url && profile) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                const users = data.jsonUsers as JsonUser[] || [];
				setJsonUsers(users);
				// 選択を維持する場合は、既存のselectedMemberIdを使用、そうでない場合は自分のIDを使用
				const targetUserId = preserveSelection && selectedMemberId ? selectedMemberId : profile.userId;
				const user2 = users.find((user: JsonUser) => user["LINE ID"] === targetUserId);
				setUser(user2 || null);
				if (!preserveSelection) {
					setSelectedMemberId(profile.userId);
				}
				console.log(user2);
            }
        } catch (error) {
            alert(error);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

	const handleUserEdit = (key: string, newValue: string) => {
		if (!user) return;
		const updatedUser = { ...user };
		updatedUser[key] = newValue;
		setUser(updatedUser);
	};

	const getChildValue = (childNumber: number): string => {
		if (!user) return '';
		const childKey = `child${childNumber}`;
		return user[childKey] || '';
	};

	const handleChildEdit = (childNumber: number, newValue: string) => {
		const childKey = `child${childNumber}`;
		handleUserEdit(childKey, newValue);
	};
	
	const saveAllChanges = async () => {
		if (!user) return;
		setIsSaving(true);
		try {
			const formData = new FormData();
			formData.append('func', 'updateUser');
			formData.append('LINE ID', user["LINE ID"]);
			formData.append('Kikiashi', user["Kikiashi"] || '');
			formData.append('Position', user["Position"] || '');
			formData.append('SelfRating', user["SelfRating"] || '');
			formData.append('Birthday', user["Birthday"] || '');
			formData.append('BirthPlace', user["BirthPlace"] || '');
			formData.append('PayNow', user["PayNow"] || '');
			
			// 子供の情報を追加
			for (let i = 1; i <= 5; i++) {
				const childKey = `child${i}`;
				formData.append(childKey, user[childKey] || '');
			}
						
			const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}`, {
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
			// ユーザー情報を再取得（選択されたメンバーを維持）
			await loadUsers(true);
			alert(lang === 'ja-JP' ? 'ユーザー情報を更新しました。' : 'User information updated successfully.');
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

	const isUserManager = jsonUsers.some(user => user["LINE ID"] === profile?.userId && user["幹事フラグ"] === '幹事');

	const handleMemberChange = (memberId: string) => {
		setSelectedMemberId(memberId);
		const selectedUser = jsonUsers.find((user: JsonUser) => user["LINE ID"] === memberId);
		setUser(selectedUser || null);
	};

	// 自分以外のメンバーリストを取得
	const otherMembers = jsonUsers.filter((user: JsonUser) => user["LINE ID"] !== profile?.userId);

	return (
		<>
			{!loading && user ? (
				<>
					{/* 幹事の場合、メンバー選択コンボボックスを表示 */}
					{isUserManager && (
						<Box sx={{margin:1}}>
							<Autocomplete
								options={[
									// 自分の情報
									{ id: profile?.userId || '', name: jsonUsers.find(u => u["LINE ID"] === profile?.userId)?.["伝助上の名前"] || profile?.displayName || '自分' },
									// 自分以外のメンバー
									...otherMembers.map((member) => ({
										id: member["LINE ID"],
										name: member["伝助上の名前"] || member["ライン上の名前"]
									}))
								]}
								getOptionLabel={(option) => option.name}
								value={jsonUsers.find(u => u["LINE ID"] === selectedMemberId) ? {
									id: selectedMemberId || '',
									name: jsonUsers.find(u => u["LINE ID"] === selectedMemberId)?.["伝助上の名前"] || jsonUsers.find(u => u["LINE ID"] === selectedMemberId)?.["ライン上の名前"] || ''
								} : null}
								onChange={(event, newValue) => {
									if (newValue) {
										handleMemberChange(newValue.id);
									}
								}}
								renderInput={(params) => (
									<TextField 
										{...params} 
										label={lang === 'ja-JP' ? 'メンバー選択' : 'Select Member'}
										placeholder={lang === 'ja-JP' ? 'メンバーを検索...' : 'Search member...'}
									/>
								)}
								fullWidth
							/>
						</Box>
					)}
					<Box sx={{margin:1}}>
						<TextField 
								value={user["伝助上の名前"] || ''} 
								disabled
								fullWidth
								label={lang === 'ja' ? '表示名称' : 'Display Name'} 
							/>
						</Box>
					<Box sx={{margin:1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
						<Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
							{lang === 'ja' ? '子供の登録' : 'Children Registration'}
						</Typography>
						<Button
							variant="contained"
							color="primary"
							onClick={saveAllChanges}
							disabled={isSaving}
							size="small"
						>
							{isSaving ? <CircularProgress size={20} /> : lang === 'ja-JP' ? '保存' : 'Save'}
						</Button>
					</Box>
					{/* 子供の登録フィールド */}
					{Array.from({ length: 5 }, (_, i) => i + 1).map((childNumber) => (
						<Box key={childNumber} sx={{margin:1}}>
							<TextField 
								fullWidth
								label={lang === 'ja' ? `子供${childNumber}` : `Child ${childNumber}`}
								value={getChildValue(childNumber)}
								onChange={(e) => handleChildEdit(childNumber, e.target.value)}
								placeholder={lang === 'ja' ? '子供の名前を入力' : 'Enter child name'}
							/>
						</Box>
					))}
					<Box sx={{margin:1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
						<Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
							{lang === 'ja-JP' ? 'その他（チーム分けに利用）' : 'Others (for team allocation)'}
						</Typography>
						<Button
							variant="contained"
							color="primary"
							onClick={saveAllChanges}
							disabled={isSaving}
							size="small"
						>
							{isSaving ? <CircularProgress size={20} /> : lang === 'ja-JP' ? '保存' : 'Save'}
						</Button>
					</Box>
					<Box sx={{margin:1}}>
						<FormControl fullWidth>
							<InputLabel>{lang === 'ja' ? '利き足' : 'Foot Preference'}</InputLabel>
							<Select 
								value={user["Kikiashi"] || ''} 
								onChange={(e) => handleUserEdit("Kikiashi", e.target.value)} 
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
								value={user["Position"] || ''} 
								onChange={(e) => handleUserEdit("Position", e.target.value)} 
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
								value={user["SelfRating"] || ''} 
								onChange={(e) => handleUserEdit("SelfRating", e.target.value)} 
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
							value={formatDateToSingaporeTime(user["Birthday"] || '')} 
							onChange={(e) => handleUserEdit("Birthday", e.target.value)} 
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
								value={user["BirthPlace"] || ''} 
								onChange={(e) => handleUserEdit("BirthPlace", e.target.value)} 
							>
								{birthplaceOptions.map((option, ind) => (
									<MenuItem key={option} value={birthplaceOptionsEng[ind]}>{lang==="ja-JP" ? option : birthplaceOptionsEng[ind]}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{margin:1}}>
						<TextField 
							fullWidth
							label={lang === 'ja' ? 'PayNow' : 'PayNow'}
							value={user["PayNow"] || ''} 
							onChange={(e) => handleUserEdit("PayNow", e.target.value)} 
							placeholder={lang === 'ja' ? 'PayNow情報を入力' : 'Enter PayNow information'}
						/>
					</Box>
				</>
			) : (
				<LoadingSpinner />
			)}
		</>
	);
}