'use client';
import { useLiff } from '@/app/liffProvider';
import { Profile } from '@liff/get-profile';
import { useEffect, useState } from 'react';

export default function Test() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { liff } = useLiff();

    useEffect(() => {
        if (liff) {
            liff.ready.then(async () => {
                if (!liff.isLoggedIn()) {
                    console.log("liff login..." + liff);
                    liff.login({ redirectUri: window.location.href });
                } else {
                    await loadProfile();
                }
                const idToken = liff.getDecodedIDToken();
                if (idToken) {
                    const userId = idToken.sub;
                    console.log(userId);
                }
                setIsLoading(false);
            });
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
                });
                const data = await response.json();
                setResponseData(data.result);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    async function loadProfile() {
        if (liff?.isLoggedIn()) {
            const profileData = await liff.getProfile();
            setProfile(profileData);
        }
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div>
                {profile && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                            setProfile(null);
                            // location.reload();
                        }}
                        className='bg-red-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-red-600'
                    >
                        logout
                    </button>
                ) : (
                    <button
                        onClick={() => liff?.login({ redirectUri: window.location.href })}
                        className='bg-blue-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-blue-600'
                    >
                        login
                    </button>
                )}
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Enter data"
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