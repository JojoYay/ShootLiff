'use client';
import { useEffect, useState } from 'react';
import { Autocomplete, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { Profile } from '@liff/get-profile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useLiff } from '@/app/liffProvider';
import LoadingSpinner from '../loadingSpinner';
import LoadingModal from '@/app/components/LoadingModal';
import { Invoice } from '@/app/types/calendar';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [amount, setAmount] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');
    const [amountErr, setAmountErr] = useState<string>("");
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            loadInvoices(calendarId, value);
        } else if (profile?.userId){
            loadInvoices(calendarId, profile?.userId);
        }
    };

    const loadInvoices = async (calendarId: string, userId: string) => {
        setSrc('');
        setFile(null);
        setLoading(true);
        try {
            let url = process.env.SERVER_URL + `?func=getInvoices`;
            url = url + '&calendarId=' + encodeURIComponent(calendarId);
            url = url + '&userId=' + encodeURIComponent(userId);
            url = url + '&lang=' + encodeURIComponent(lang);
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                // setSrc(data.picUrl || '');
                setActDate(data.actDate);
                setInfo(data.statusMsg);
                setInfo2(data.statusMsg2);
                setInfo3(data.statusMsg3);
                // New code to map data to Invoice interface
                const invoices: Invoice[] = data.invoices.slice(1).map((invoice: any) => ({
                    invoiceId: invoice[0],
                    uploadDate: new Date(invoice[1]),
                    userName: invoice[2],
                    amount: invoice[3],
                    memo: invoice[4],
                    picUrl: invoice[5],
                    status: invoice[6] as '未払い' | '支払済',
                }));

                setInvoices(invoices); // Set the invoices state
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
            let url = process.env.SERVER_URL + `?func=getInvoices&func=getUsers`;
            url = url + '&calendarId=' + encodeURIComponent(title);
            url = url + '&userId=' + encodeURIComponent(userId);
            url = url + '&lang=' + encodeURIComponent(lang);

            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                setActDate(data.actDate);
                setInfo(data.statusMsg);
                setInfo2(data.statusMsg2);
                setInfo3(data.statusMsg3);
                setUsers(data.users.slice(1));

                const invoices: Invoice[] = data.invoices.slice(1).map((invoice: any) => ({
                    invoiceId: invoice[0],
                    uploadDate: new Date(invoice[1]),
                    userName: invoice[2],
                    amount: invoice[3],
                    memo: invoice[4],
                    picUrl: invoice[5],
                    status: invoice[6] as '未清算' | '清算済',
                }));
                setInvoices(invoices); // Set the invoices state
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

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        }
    }

    const handleUpload = async () => {
        try{
            if (isSubmitting) return; // 2重送信防止
            // バリデーションを先に実行
            if(!amount){
                setAmountErr("金額をSGDで入力して下さい");
                return;
            }
            if(!file){
                setAmountErr("請求書のスクリーンショットを添付してください");
                return;
            }

            setIsSubmitting(true);
            setLoading(true);
            const formData = new FormData();
            let targetUserId = profile?.userId;
            if (selectedUserId) {
                targetUserId = selectedUserId;
            }
    
            if (file && targetUserId) { // Use selectedFile here
                formData.append('func', 'uploadInvoice');
                formData.append('calendarId', calendarId);
                formData.append('actDate', actDate);
                formData.append('userId', targetUserId);
                formData.append('amount', amount);
                formData.append('remarks', remarks);
                const fileReader = new FileReader(); // Use a new FileReader for upload
                fileReader.readAsDataURL(file);
                fileReader.onload = async () => {
                    try{
                        setLoading(true);
                        setIsSubmitting(true);
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
                                    alert("登録が完了しました！");
                                    loadInvoices(calendarId, profile? profile.userId : '');
    
                                    console.log('File uploaded successfully:', data);
                                } catch (error) {
                                    console.error('Error uploading file:', error);
                                    setResult('Error uploading file:'+error);
                                }
                            }
                        }
                    } finally {
                        setLoading(false);
                        setIsSubmitting(false);
                        setAmountErr("");
                        setAmount("");
                        setFile(null);
                        setSrc("");
                        setRemarks("");
                    }
                };
            }
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!actDate) return; // Ensure actDate is available

        // Confirmation dialog
        const confirmed = window.confirm("この請求書を削除してもよろしいですか？");
        if (!confirmed) return; // Exit if the user cancels
        setIsSubmitting(true);
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('func', 'deleteInvoice');
            formData.append('invoiceId', invoiceId);
            formData.append('actDate', actDate);

            const url = process.env.SERVER_URL + '';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Reload invoices after deletion
            loadInvoices(calendarId, selectedUserId || profile?.userId || '');
        } catch (error) {
            alert(error);
            console.error('Error deleting invoice:', error);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <>
        {actDate ? (
            <>
                <LoadingModal 
                    open={isSubmitting} 
                />
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
                    <Box style={{margin:'5px'}}>

                        {isKanji && (
                            <>
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
                            </>
                        )}

                        <FormControl fullWidth margin="normal">
                            <TextField
                                id="amount"  // 修正: id属性を追加
                                label="金額"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                variant="outlined"
                                fullWidth
                            />
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <TextField
                                id="remarks"  // 修正: id属性を追加
                                label="メモ"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                variant="outlined"
                                fullWidth
                                multiline
                            />
                        </FormControl>
                        <Button
                            component="label"
                            // role={undefined}
                            variant="contained"
                            tabIndex={-1}
                            startIcon={<CloudUploadIcon />}
                            disabled={loading}
                        >
                            {loading && profile ? 'Loading...' : lang === 'ja-JP' ? 'Invoiceを選択' : "Select Invoice Pic"}
                            <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
                        </Button>

                        <Box style={{margin:'5px'}}>
                            <img id="uploadedImage" alt="Uploaded Preview" style={{ maxWidth: '100%', display: (file || src) ? 'block' : 'none' }} />
                        </Box>

                        {amountErr && (
                            <Box style={{margin:'5px', display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2" color="error" style={{ maxWidth: '100%' }}>
                                    {amountErr}
                                </Typography>
                            </Box>
                        )}

                        <Box style={{margin:'5px'}}>
                        {(loading || isSubmitting)? (
                            <CircularProgress size={24} />
                        ) : (
                            <Button variant="contained" color="primary" onClick={handleUpload} disabled={(!file && !amount) || loading || isSubmitting}>
                                送信
                            </Button>
                        )}
                        </Box>

                        {result &&
                            <Box style={{margin:'5px', display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2" style={{ maxWidth: '100%', display: result ? 'block' : 'none' }}>
                                    {result}
                                </Typography>
                            </Box>
                        }
                    </Box>

                <Box style={{margin:'5px', display: 'flex', alignItems: 'center'}}>
                    <Typography variant="body2" style={{ maxWidth: '100%', display: result ? 'block' : 'none' }}>
                        これまでの清算データ
                    </Typography>
                </Box>

                <Box>
                    {invoices.reverse().map((invoice) => (
                        <Box key={invoice.invoiceId} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="h6">金額: SGD {invoice.amount} </Typography>
                                {invoice.status === '未清算' && ( // Show delete icon for unsettled invoices
                                    <Button 
                                        onClick={() => handleDeleteInvoice(invoice.invoiceId)} 
                                        color="secondary" 
                                        style={{ padding: '0' }} // Remove padding for a better fit
                                    >
                                        <DeleteIcon />
                                    </Button>
                                )}
                            </Box>
                            <Typography variant="body2">メモ: {invoice.memo}</Typography>
                            <Typography variant="body2">状態: {invoice.status}</Typography>
                            <Typography variant="body2">申請日: {invoice.uploadDate.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} </Typography>
                            <img src={invoice.picUrl} alt="Invoice" style={{ maxWidth: '100%' }} />
                        </Box>
                    ))}
                </Box>

            </Box>
        </>
        ) : (
            <LoadingSpinner />
        )}
        
        </>
   );
}

