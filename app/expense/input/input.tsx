'use client';
import { useEffect, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { Profile } from '@liff/get-profile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useLiff } from '@/app/liffProvider';
// Existing code for InputExpense component

export default function InputExpense() {
    const [file, setFile] = useState<File | null>(null);
    const [src, setSrc] = useState<string>('');
    // const [amount, setAmount] = useState('');
	const { liff } = useLiff();
	const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [result, setResult] = useState('');
    const [info, setInfo] = useState<string>('');

	if (liff) {
		liff.ready.then(() => {
			if (!liff.isLoggedIn()) {
				liff.login({ redirectUri: window.location.href });
			}
		})
	}

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setTitle(urlParams.get('title') || '');
    }, [])

    useEffect(() => {
        if(title && profile){
            loadExpenseInfo(title, profile.userId);
        }
    }, [title, profile])

	useEffect(() => {
		console.log("Liff login (register page)");
		if (liff?.isLoggedIn()) {
			(async () => {
				const prof = await liff.getProfile();
				setProfile(prof);
			})();
		}
	}, [liff]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);

            // Display the uploaded image
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgElement = document.getElementById('uploadedImage') as HTMLImageElement;
                if (imgElement && e.target?.result) {
                    imgElement.src = e.target.result as string;
                }
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const loadExpenseInfo = async (title: string, userId: string) => {
        setLoading(true);
        try {
            let url = process.env.NEXT_PUBLIC_SERVER_URL + `?func=getExpenseWithStatus`;
            url = url + '&title=' + encodeURIComponent(title);
            url = url + '&userId=' + encodeURIComponent(userId);
    
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                if(data.picUrl){
                    const imgElement = document.getElementById('uploadedImage') as HTMLImageElement;
                    if (imgElement && data.picUrl) {
                        imgElement.src = data.picUrl;
                        setSrc(data.picUrl);
                    }
                }
                console.log(data);
                setInfo(data.statusMsg?.replace(/\n/g, '<br />'));
                // setInfo(data.statusMsg);
            }
        } catch (error) {
            alert(error);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }




    const handleUpload = async () => {
        setLoading(true);
        const formData = new FormData();
        if (file && profile) {
            // formData.append('message', 'リマインド');
            // formData.append('userId', userId)
            formData.append('func', 'upload');
            // formData.append('file', file);
            // formData.append('amount', amount);
            formData.append('title', title);
            formData.append('userId', profile.userId);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                if (reader.result) {
                    const base64File = (reader.result as string).split(',')[1];
                    formData.append('file', base64File);
                    // console.log(base64File);

                    const url = process.env.NEXT_PUBLIC_SERVER_URL;
                    if (url) {
                        try {
                            const response = await fetch(url, {
                                method: 'POST',
                                body: formData,
                                headers: {
                                    'Accept': 'application/json',
                                },
                            });
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            const data = await response.json();

                            const imgElement = document.getElementById('uploadedImage') as HTMLImageElement;
                            if (imgElement && data.picUrl) {
                                imgElement.src = data.picUrl;
                                setSrc(data.picUrl);
                            }
                            // setResult(data.picUrl);

                            // 'https://lh3.googleusercontent.com/d/1KsKJg9LNZOS0pMGq4Yqzv10ZfBGDsEKB';
                            setResult("支払い登録が完了しました！");
                            console.log('File uploaded successfully:', data);
                        } catch (error) {
                            console.error('Error uploading file:', error);
                            setResult('Error uploading file:'+error);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            };
        } else {
            setLoading(false);
        }
    };

    return (
        <>
        {title ? (
        <div>
            <div style={{margin:'5px'}}>
                <Typography variant="body1">{title} の支払い登録</Typography>
            </div>
            <div style={{margin:'5px'}}>
            <Typography 
                variant="caption" 
                style={{ marginTop: '5px' }}
                dangerouslySetInnerHTML={{ 
                    __html: info || '' 
                }}
            />
                {/* <Typography variant="body2">{info}</Typography> */}
            </div>
            {/* <div style={{margin:'5px'}}>
                <TextField type="text" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            </div> */}
            <div style={{margin:'5px'}}>
                <Button
                    component="label"
                    // role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    startIcon={<CloudUploadIcon />}
                    disabled={loading}
                >
                    {loading && profile ? 'Loading...' : 'PayNow写真を選択'}
                    <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                </Button>
            </div>
            <div style={{margin:'5px'}}>
                <img id="uploadedImage" alt="Uploaded Preview" style={{ maxWidth: '100%', display: (file || src) ? 'block' : 'none' }} />
            </div>
            <div style={{margin:'5px'}}>
                <Button variant="contained" color="primary" onClick={handleUpload} disabled={loading}>送信</Button>
            </div>
            <div style={{margin:'5px'}}>
                {result && <div dangerouslySetInnerHTML={{ __html: result }} style={{ maxWidth: '100%', display: result ? 'block' : 'none' }}></div>}
            </div>
        </div>
        ) : (
            <div></div>
        )}
        </>
   );
}

