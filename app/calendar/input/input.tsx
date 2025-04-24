'use client';
import { useEffect, useState } from 'react';
import { Autocomplete, Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { Profile } from '@liff/get-profile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useLiff } from '@/app/liffProvider';
import LoadingSpinner from '../loadingSpinner';
// Existing code for InputExpense component

export default function InputPatifipationFee() {
    const [file, setFile] = useState<File | null>(null);
    const [src, setSrc] = useState<string>('');
    // const [amount, setAmount] = useState('');
	const { liff } = useLiff();
	const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [calendarId, setCalendarId] = useState('');
    const [result, setResult] = useState('');
    const [info, setInfo] = useState<string>('');
    const [info2, setInfo2] = useState<string>('');
    const [info3, setInfo3] = useState<string>('');
    const [actDate, setActDate] = useState<string>('');
	const [users, setUsers] = useState<string[][]>([]);
    const [selectedUserId, setSelectedUserId] = useState< string | null >(null);
    const [isKanji, setIsKanji] = useState(false);
    const [lang, setLang] = useState<string>('ja-JP');

    useEffect(() => {
        if (liff) {
            liff.ready.then(() => {
                if (!liff.isLoggedIn()) {
                    const redirectUri = new URL(window.location.href).href;
                    liff.login({ redirectUri: redirectUri });
                } else {
                    liff.getProfile().then(profile => {
                        setProfile(profile);
                        setLang(liff.getLanguage());
                    });
                }
            });
        }
    }, [liff]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setCalendarId(urlParams.get('calendarId') || '');
    }, [])

    useEffect(() => {
        if(calendarId && profile){
            loadPatificationFeeAndUsers(calendarId, profile.userId);
        }
    }, [calendarId, profile]);

    useEffect(() => {
        if (users && profile) {
            // ユーザーリストから自分のUserIdと一致するユーザーを探し、幹事フラグを確認
            const currentUser = users.find(user => user[2] === profile.userId);
            if (currentUser && currentUser[3] === '幹事') {
                setIsKanji(true);
            } else {
                setIsKanji(false);
            }
        }
    }, [users, profile]);

    const handleUserChange = (value: string) => {
        setResult('');
        setSelectedUserId(value);
        setSrc('');
        setFile(null);
        if(value){
            loadPatificationFeeInfo(calendarId, value);
        } else if (profile?.userId){
            loadPatificationFeeInfo(calendarId, profile?.userId);
        }
    };

    const loadPatificationFeeInfo = async (title: string, userId: string) => {
        setSrc('');
        setFile(null);
        setLoading(true);
        try {
            let url = process.env.SERVER_URL + `?func=getPaticipationFeeWithStatus`;
            url = url + '&calendarId=' + encodeURIComponent(title);
            url = url + '&userId=' + encodeURIComponent(userId);
            url = url + '&lang=' + encodeURIComponent(lang);
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                setSrc(data.picUrl || '');
                setActDate(data.actDate);
                setInfo(data.statusMsg);
                setInfo2(data.statusMsg2);
                setInfo3(data.statusMsg3);
            }
        } catch (error) {
            alert(error);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const loadPatificationFeeAndUsers = async (title: string, userId: string) => {
        setLoading(true);
        try {
            let url = process.env.SERVER_URL + `?func=getPaticipationFeeWithStatus&func=getUsers`;
            url = url + '&calendarId=' + encodeURIComponent(title);
            url = url + '&userId=' + encodeURIComponent(userId);
            url = url + '&lang=' + encodeURIComponent(lang);

            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                if(data.picUrl){
                    setSrc(data.picUrl);
                }
                console.log(data);
                setActDate(data.actDate);
                setInfo(data.statusMsg);
                setInfo2(data.statusMsg2);
                setInfo3(data.statusMsg3);
                setUsers(data.users.slice(1));
            }
        } catch (error) {
            alert(error);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (src) { // src state が更新されたら実行
            const imgElement = document.getElementById('uploadedImage') as HTMLImageElement;
            if (imgElement) {
                imgElement.src = src; // img 要素の src 属性を設定
            }
        }
    }, [src]); // src state に依存

    const handleFileSelectionAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Display the uploaded image
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgElement = document.getElementById('uploadedImage') as HTMLImageElement;
                if (imgElement && e.target?.result) {
                    imgElement.src = e.target.result as string;
                    setSrc(e.target.result as string);
                }
            };
            reader.readAsDataURL(selectedFile);

            // Start uploading immediately after file selection
            setLoading(true);
            const formData = new FormData();
            let targetUserId = profile?.userId;
            if (selectedUserId) {
                targetUserId = selectedUserId;
            }
            if (selectedFile && targetUserId) { // Use selectedFile here
                formData.append('func', 'uploadPaticipationPayNow');
                formData.append('calendarId', calendarId);
                formData.append('actDate', actDate);
                formData.append('userId', targetUserId);
                const fileReader = new FileReader(); // Use a new FileReader for upload
                fileReader.readAsDataURL(selectedFile);
                fileReader.onload = async () => {
                    if (fileReader.result) {
                        const base64File = (fileReader.result as string).split(',')[1];
                        formData.append('file', base64File);
                        // console.log(base64File);
                        const url = process.env.SERVER_URL;
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
        }
    };

    return (
        <>
        {actDate ? (
            <Box>
                <Box style={{margin:'5px'}}>
                    <Typography variant="body1">{actDate} </Typography>
                </Box>
                <Box style={{margin:'5px'}}>
                    <Typography variant="body2">{info}</Typography>
                </Box>
                {info2 && (
                <Box style={{margin:'5px'}}>
                    <Typography variant="body2">{info2}</Typography>
                </Box>
                )}
                {info3 && (
                <Box style={{margin:'5px'}}>
                    <Typography variant="body2">{info3}</Typography>
                </Box>
                )}
                {isKanji && (
                    // <FormControl fullWidth margin="normal">
                    //     <InputLabel id="user-select-label">代理ユーザーを選択</InputLabel>
                    //     <Select
                    //         labelId="user-select-label"
                    //         id="user-select"
                    //         value={selectedUserId || ''}
                    //         label="代理ユーザーを選択"
                    //         onChange={(event: SelectChangeEvent) => handleUserChange(event.target.value)}
                    //     >
                    //         <MenuItem value="">
                    //             <em>なし</em>
                    //         </MenuItem>
                    //         {users.map((user) => (
                    //             <MenuItem key={user[2]} value={user[2]}>
                    //                 {user[1]}
                    //             </MenuItem>
                    //         ))}
                    //     </Select>
                    // </FormControl>
                    <FormControl fullWidth margin="normal">
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => option[1]} // 表示するラベル
                            value={selectedUserId ? users.find(user => user[2] === selectedUserId) : null}
                            onChange={(event, newValue) => {
                                handleUserChange(newValue ? newValue[2] : '');
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="代理ユーザーを選択" variant="outlined" />
                            )}
                        />
                    </FormControl>
                )}
                <Box style={{margin:'5px'}}>
                    <Button
                        component="label"
                        // role={undefined}
                        variant="contained"
                        tabIndex={-1}
                        startIcon={<CloudUploadIcon />}
                        disabled={loading}
                    >
                        {loading && profile ? 'Loading...' : lang === 'ja-JP' ? 'PayNow写真を選択' : "Select PayNow Pic"}
                        <input type="file" onChange={handleFileSelectionAndUpload} style={{ display: 'none' }} />
                    </Button>
                </Box>
                <Box style={{margin:'5px'}}>
                    <img id="uploadedImage" alt="Uploaded Preview" style={{ maxWidth: '100%', display: (file || src) ? 'block' : 'none' }} />
                </Box>
                <Box style={{margin:'5px'}}>
                    {result &&
                        <Typography variant="body2" style={{ maxWidth: '100%', display: result ? 'block' : 'none' }}>
                            {result}
                        </Typography>
                    }
                </Box>
            </Box>
        ) : (
            <LoadingSpinner />
        )}
        </>
   );
}

