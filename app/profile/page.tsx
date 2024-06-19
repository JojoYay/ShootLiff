'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';
import Ranking from './ranking';
import { CircularProgress, Grid, Pagination } from '@mui/material';

export default function ProfilePage() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const { liff } = useLiff();

	if (liff) {
		liff.ready.then(() => {
			if (!liff.isLoggedIn()) {
				liff.login();
			}
		})
	}

	useEffect(() => {
		if (liff?.isLoggedIn()) {
			(async () => {
				const profile = await liff.getProfile();
				setProfile(profile);
			})();
		}
	}, [liff]);

	const [responseData, setResponseData] = useState<string[][] | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 7;

	useEffect(() => {
		if (profile?.userId) {
			fetchVideo();
		}
	}, [profile]);

	const fetchVideo = async () => {
		try {
			console.log("fetchData");
			const url = process.env.SERVER_URL + `?func=getVideo&userId=${profile?.userId}`;
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log(data.result);
				setResponseData(data.result.reverse()); // Reverse the order
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
		setCurrentPage(value);
	};

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = responseData ? responseData.slice(startIndex, endIndex) : [];

	return (
		<>
			{responseData ? (
				<>
					<Grid container spacing={2} style={{ margin: '10px' }}>
						{currentItems.map((data, index) => (
							<div key={index}>
								<Ranking url={data[2]} title={data[1]} date={data[0].substring(0, 10)}></Ranking>
							</div>
						))}
					</Grid>
					<Pagination
						count={Math.ceil(responseData.length / itemsPerPage)}
						page={currentPage}
						onChange={handlePageChange}
						style={{ display: 'flex', justifyContent: 'center', margin: '20px' }}
					/>
				</>
			) : (
				<CircularProgress />
			)}
		</>
	);
}