'use client';
import { useEffect, useState } from 'react';
import VideoCard from './videoCard';
import { CircularProgress, Grid, Pagination } from '@mui/material';

export default function Video() {
	useEffect(() => {
		fetchVideo();
	}, []);

	const [responseData, setResponseData] = useState<string[][] | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	const fetchVideo = async () => {
		try {
			const url = process.env.NEXT_PUBLIC_SERVER_URL + '?func=getVideo';
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				// console.log(data.result);
				setResponseData(data.result.slice(2).reverse()); // Reverse the order
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
					<Pagination
						count={Math.ceil(responseData.length / itemsPerPage)}
						page={currentPage}
						onChange={handlePageChange}
						style={{ display: 'flex', justifyContent: 'center', margin: '20px' }}
					/>				
					<Grid container spacing={2} style={{ margin: '5px', width:'100%' }}>
						{currentItems.map((data, index) => (
							<VideoCard key={index} url={data[2]} title={data[1]} date={data[0]}></VideoCard>
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
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
					<div>Loading...</div>
					<CircularProgress />
				</div>
			)}
		</>
	);
}