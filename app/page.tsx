'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';

export default function Home() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const { liff } = useLiff();
	if (liff) {
		liff.ready.then(() => {
			if (!liff.isLoggedIn()) {
				liff.login();
			}
			const idToken = liff.getDecodedIDToken();
			if (idToken) {
				const userId = idToken.sub;
				console.log(userId);
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


	const [responseData, setResponseData] = useState('');
	const [inputData, setInputData] = useState('');

	const fetchData = async () => {
		try {
			const url = process.env.SERVER_URL + `?func=test&param=${inputData}&userId=${profile?.userId}`;
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
					// headers: {
					// 	'Access-Control-Allow-Origin': process.env.SERVER_URL
					// } as RequestInit,
				});
				const data = await response.json();
				setResponseData(data.result);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};



	return (
		<>
			<div>
				{profile && (
					<>
						{/* eslint-disable-next-line @next/next/no-img-element */},
						<img
							src={profile.pictureUrl}
							alt='profile'
							className='rounded-full w-20 h-20 mx-auto mb-4'
						/>
						<p className='text-center font-bold text-xl'>userId: {profile.userId}</p>
						<p className='text-center text-gray-500'>displayName: {profile.displayName}</p>
					</>
				)}
				{profile ? (
					<button
						onClick={() => {
							liff?.logout();
							location.reload();
						}}
						className='bg-red-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-red-600'
					>
						logout
					</button>
				) : (
					<button
						onClick={() => liff?.login()}
						className='bg-blue-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-blue-600'
					>
						login
					</button>
				)}
			</div>

			<div>
				<input
					type="text"
					placeholder="Enter data aaaaaaa"
					value={inputData}
					onChange={(e) => setInputData(e.target.value)}
				/>
				<button onClick={fetchData}>Get Data</button>
				<div>
					<p>Response Data: {responseData}</p>
				</div>
			</div>

		</>
	);
}









// import packageJson from "../package.json";
// import { AppProps } from "next/app";

// export default function Home(props:AppProps) {
//   /** You can access to liff and liffError object through the props.
//    *  const { liff, liffError } = props;
//    *  console.log(liff.getVersion());
//    *
//    *  Learn more about LIFF API documentation (https://developers.line.biz/en/reference/liff)
//    **/
//   return (
//     <div>
//       <div className="home">
//         <h1 className="home__title">
//           Welcome to <br />
//           <a
//             className="home__title__link"
//             href="https://developers.line.biz/en/docs/liff/overview/"
//           >
//             LIFF Starter!
//           </a>
//         </h1>
//         <div className="home__badges">
//           <span className="home__badges__badge badge--primary">
//             LIFF Starter
//           </span>
//           <span className="home__badges__badge badge--secondary">nextjs</span>
//           <span className="home__badges__badge badge--primary">
//             {packageJson.version}
//           </span>
//           <a
//             href="https://github.com/line/line-liff-v2-starter"
//             target="_blank"
//             rel="noreferrer"
//             className="home__badges__badge badge--secondary"
//           >
//             GitHub
//           </a>
//         </div>
//         <div className="home__buttons">
//           <a
//             href="https://developers.line.biz/en/docs/liff/developing-liff-apps/"
//             target="_blank"
//             rel="noreferrer"
//             className="home__buttons__button button--primary"
//           >
//             LIFF Documentation
//           </a>
//           <a
//             href="https://liff-playground.netlify.app/"
//             target="_blank"
//             rel="noreferrer"
//             className="home__buttons__button button--tertiary"
//           >
//             LIFF Playground
//           </a>
//           <a
//             href="https://developers.line.biz/console/"
//             target="_blank"
//             rel="noreferrer"
//             className="home__buttons__button button--secondary"
//           >
//             LINE Developers Console
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// }
