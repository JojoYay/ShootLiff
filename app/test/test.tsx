'use client';
import { useEffect } from 'react';
import { useLiff } from '../liffProvider';
import LoadingSpinner from '../calendar/loadingSpinner';

export default function Test() {
    // const { liff } = useLiff();

    // useEffect(() => {
    //     if (liff) {
    //         liff.ready.then(() => {
    //             if (!liff.isLoggedIn()) {
    //                 const redirectUri = new URL(window.location.href).href;
    //                 liff.login({ redirectUri: redirectUri });
    //             } else {
    //                 liff.getProfile().then(profile => {
	// 					console.log(profile);
	// 					// setLang(liff.getLanguage());
    //                 });
    //             }
    //         });
    //     }
    // }, [liff]);

	return (
		<>
		<LoadingSpinner/>
        test
		</>
	);
}