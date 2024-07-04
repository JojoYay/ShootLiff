'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';
import { Autocomplete, Button, CircularProgress, Grid, TextField } from '@mui/material';

export default function Registration() {
	const [members, setMembers] = useState<string[]>([]);
	const [value, setValue] = useState<string>('');
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState('');
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
				setProfile(prof);
			})();
		}
	}, [liff]);

	useEffect(() => {
		if(profile?.userId){
			fetchMembers();
		}
	}, [profile]);


	// useEffect(() => {
	// 	getDensukeName();
	// }, [profile, members]);

	const fetchMembers = async () => {
		try {
			const url = process.env.SERVER_URL + `?func=getMembers&func=getDensukeName&userId=${profile?.userId}`;
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log(data);
				setMembers(data.members);
				setValue(data.densukeName);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	const register = async () => {
		setLoading(true);
		setResult('');
		try {
			if(value && profile?.userId){
				const url = process.env.SERVER_URL + `?func=register&userId=${profile?.userId}&densukeName=${value}`;
				if (url) {
					const response = await fetch(url, {
						method: 'GET',
					});
					const data = await response.json();
					console.log(data.result);
					setResult(data.result);
				}
			}
		} catch (error) {
			setResult(error as string);
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	};


	const defaultProps = {
		options: members,
		getOptionLabel: (member: string) => member,
	};

	return (
		<>
			{members.length > 0 ? (
				<>
					<h5>あなたの伝助上で登録している名称を選択してください</h5>
					<Grid container spacing={2}>
						<Grid item>
							<Autocomplete
								{...defaultProps}
								id="disable-clearable"
								disableClearable
								value={value}
								onChange={(event: any, newValue: string | null) => {
									if(!!newValue){
										setValue(newValue);
									}
								}}
								sx={{ width: 180 }}
								renderInput={(params) => (
									<TextField {...params} label="Please Select Densuke Name" variant="standard" />
								)}
							/>
						</Grid>
						<Grid item>
							<Button onClick={register} variant="contained" disabled={loading}>
							{loading ? 'Loading...' : '送信'}
							</Button>
						</Grid>
						<Grid item>
							{result && <div dangerouslySetInnerHTML={{ __html: result }}></div>}
						</Grid>
					</Grid>
				</>
			) : (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
					<div>Preparing Registration... </div>
					<CircularProgress />
				</div>
			)}
		</>
	);
}