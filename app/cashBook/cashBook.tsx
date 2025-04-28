 'use client';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CalendarforCB, CashBook, Payment } from '../types/cashBook';
import { Box, Button, Card, CardContent, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Select, TextField, Typography } from '@mui/material';
import { User } from '../types/user';
import LoadingSpinner from '../calendar/loadingSpinner';
import AvatarIcon from '../stats/avatarIcon';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useLiff } from '../liffProvider';
import { Profile } from '@liff/get-profile';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CashBookPage() {
    const { liff } = useLiff();
    useEffect(() => {
        if (liff) {
            liff.ready.then(() => {
                if (!liff.isLoggedIn()) {
                    const redirectUri = new URL(window.location.href).href;
                    liff.login({ redirectUri: redirectUri });
                } else {
                    liff.getProfile().then(profile => {
                        setProfile(profile);
                        // setLang(liff.getLanguage());
                    });
                }
            });
        }
    }, [liff]);

	const [profile, setProfile] = useState<Profile | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<string[][]>([]);
    const [calendar, setCalendar] = useState<string[][]>([]);
    const [openPayment, setOpenPayment] = useState<Payment[]>([]);
    const [cashBook, setCashBook] = useState<string[][]>([]);

    const [unlinkedPayments, setUnlinkedPayments] = useState<Payment[]>([]);
    // const [cashBook, setCashBook] = useState<CashBook[]>([]);
    const [calendarEntries, setCalendarEntries] = useState<CalendarforCB[]>([]);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null); // State for current balance
    const [carryOverAmount, setCarryOverAmount] = useState<number | null>(null); // State for carry-over amount
    const [openDialog, setOpenDialog] = useState(false); // State to control dialog visibility

    const [isKanji, setIsKanji] = useState<boolean>(false);

    const [calendarMap, setCalendarMap] = useState<Map<string, string[]>|null>(null);
    const [userMap, setUserMap] = useState<Map<string, User>|null>(null);
    const currentDate = new Date(); // 現在の日付を一度だけ取得
    const [newEntry, setNewEntry] = useState<CashBook>({
        title: '',
        bookId: '',
        memo: '',
        payeeId: '',
        // payee: null,
        amount: 0,
        balance: 0,
        calendarId: '',
        invoiceId: '',
        lastUpdate: currentDate,
        create: currentDate,
        isExpanded: false,
    });

    useEffect(() => {
		loadData();
	}, []);

    const loadData = async () => {
        setIsLoading(true);
        let url = process.env.SERVER_URL + '?func=loadCashBook&func=loadCalendar&func=getUsers&func=loadOpenPayment';
        if (url) {
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);

            setUsers(data.users);
            setCalendar(data.calendar);
            setOpenPayment(data.openPayment);
            setCashBook(data.cashBook);
        }
    };

    useEffect(() => {
        if(profile && userMap){
            setIsKanji(!!(userMap?.get(profile.userId)?.isKanji));
        }
	}, [userMap, profile]);

    useEffect(() => {
        if(users.length > 0 && calendar.length > 0 && openPayment.length > 0, cashBook.length > 0)
		generateCashBook();
	}, [users, calendar, openPayment, cashBook]);

    const generateCashBook = () => {
        console.log('generate cashBook view');
        const pUsersMap = new Map<string, User>();
        users.slice(1).forEach((user: string[]) => {
            pUsersMap.set(user[2], {
                userId: user[2],
                lineName:user[0],
                isKanji: user[3] === '幹事',
                displayName: user[1],
                pictureUrl: user[4]
            }); // Assuming userId is the key
        });
        setUserMap(pUsersMap);
        // console.log(pUsersMap);
        const pCalendarMap = new Map<string, string[]>();
        calendar.slice(1).forEach((event: string[]) => {
            pCalendarMap.set(event[0], event); // Assuming ID is the key
        });
        setCalendarMap(pCalendarMap);

        // Create a map for openPayment data
        const openPaymentMap = new Map<string, Payment>();
        openPayment.forEach((payment:any) => {
            openPaymentMap.set(payment.id, payment);
        });
        console.log(openPaymentMap);
        // Create a map to group CashBook entries by calendarId
        // const calendarMap = new Map<string, CalendarforCB>();
        let lastBalance: number | null = null;
        const calEntry:CalendarforCB[] = []; // 配列を定義

        cashBook.slice(1).reverse().forEach((item: string[], index: number) => {
            const cashBookEntry: CashBook = {
                bookId: item[0],
                title: item[1],
                memo: item[2],
                payeeId: item[3],
                payee: pUsersMap.get(item[3]) || null, // Assuming payee is a userId
                amount: Number(item[4]),
                balance: Number(item[5]),
                invoiceId: item[6],
                calendarId: item[7],
                lastUpdate: new Date(item[8]),
                updateUser: pUsersMap.get(item[9]) || null,
                create: new Date(item[10]),
                createUser: pUsersMap.get(item[11]) || null,
                invoice: openPaymentMap.get(item[6]),
                isExpanded: false
            };

            console.log('cashBookEntry', cashBookEntry);
            if (index === cashBook.slice(1).length-1) {
                setCarryOverAmount(cashBookEntry.balance);
                lastBalance = cashBookEntry.balance;
                return;
            }

            if (index === 0) {
                lastBalance = cashBookEntry.balance;
            }
            // Group CashBook entries by calendarId
            const calendarId = item[7];
            const calendarEvent = pCalendarMap.get(calendarId);
            // console.log('pcal',calendarEvent);
            if (!calEntry.find(entry => entry.calendarId === calendarId)) {
                if(calendarEvent){
                    calEntry.push({
                        calendarId: calendarId,
                        eventType: calendarEvent[1] || '',
                        eventName: calendarEvent[2] || '',
                        startDatetime: calendarEvent[3] || '',
                        endDatetime: calendarEvent[4] || '',
                        place: calendarEvent[5] || '',
                        remark: calendarEvent[6] || '',
                        eventStatus: Number(calendarEvent[7]) || 0,
                        cashBooks: [cashBookEntry],
                        subTotal:Number(item[4]),
                        isExpanded:false
                    });
                } else {
                    //カレンダー自体ない場合＝隊費入力の場合と最初の繰り越しのやつ
                    calEntry.push({
                        calendarId: uuidv4(),
                        eventType: '隊費入力系',
                        eventName: '隊費追加',
                        startDatetime: item[10],
                        endDatetime: item[10],//念のため
                        place: '',
                        remark: item[2],
                        eventStatus: 99,
                        cashBooks: [cashBookEntry],
                        subTotal:Number(item[4]),
                        isExpanded:false
                    });
                }
            } else {
                // 既存のカレンダーエントリにキャッシュブックを追加
                const existingEntry = calEntry.find(entry => entry.calendarId === calendarId);
                if (existingEntry) {
                    existingEntry.cashBooks.push(cashBookEntry);
                    existingEntry.subTotal += Number(item[4]);
                }
            }
        });
        setCurrentBalance(lastBalance);
        // Convert the map to an array
        setCalendarEntries(calEntry);
        console.log(calEntry);

        // openPaymentの表示ロジック
        const unlinkedPayments = openPayment.filter((payment: any) => {
            return !cashBook.some((entry: string[]) => entry[6] === payment.id); // cashBookに存在しないpaymentをフィルタリング
        });

        // 画面に表示するためのデータを設定
        setUnlinkedPayments(unlinkedPayments); // unlinkedPaymentsをstateに設定

        setIsLoading(false);

    }

    const insertCashBook = async () => {
        if (!newEntry) return;
        try {
            const formData = new FormData();
            formData.append('func', 'insertCashBook'); // func パラメータを追加
    
            // newEntry の各フィールドを FormData に追加
            formData.append('title', newEntry.title);
            formData.append('bookId', newEntry.bookId);
            formData.append('memo', newEntry.memo);
            // formData.append('payee', JSON.stringify(newEntry.payee)); // payee はオブジェクトなので JSON 文字列に変換
            formData.append('amount', newEntry.amount.toString());
            formData.append('balance', newEntry.balance.toString());
            formData.append('calendarId', newEntry.calendarId || '');
            // formData.append('invoiceId', newEntry.invoiceId);
            formData.append('lastUpdate', newEntry.lastUpdate.toISOString());
            if(profile){
                formData.append('updateUser', profile.userId);
                formData.append('createUser', profile.userId);
            }
            formData.append('create', newEntry.create.toISOString());
            formData.append('isExpanded', newEntry.isExpanded.toString());
            
            const response = await fetch(`${process.env.SERVER_URL}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData,
            });
            const data = await response.json();
            console.log(data);
            if(data.err){
                alert(data.err);
            }
            if(data.cashBook){
                setCashBook(data.cashBook);
            }
        } catch (error) {
            console.error('Error inserting cash book entry:', error);
        }
    };

    // const updateCashBook = async (id: string, updatedEntry: CashBook) => {
    //     try {
    //         await fetch(`${process.env.SERVER_URL}?func=updateCashBook`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ id, ...updatedEntry }),
    //         });

    //     } catch (error) {
    //         console.error('Error updating cash book entry:', error);
    //     }
    // };

    const deleteCashBook = async (id: string) => {
        if (window.confirm("このエントリを削除してもよろしいですか？")) {
            try {
                const formData = new FormData();
                formData.append('func', 'deleteCashBook'); // func パラメータを追加
                formData.append('bookId', id);
                const res = await fetch(`${process.env.SERVER_URL}`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData,
                });
                const data = await res.json();
                if(data.err){
                    alert(data.err);
                } else {
                    loadData();
                }
            } catch (error) {
                console.error('Error deleting cash book entry:', error);
            }
        }
    };

    const toggleImage = (entryIndex: number, cashBookIndex: number) => {
        const updatedCalendarEntries = [...calendarEntries];
        const cashBook = updatedCalendarEntries[entryIndex].cashBooks[cashBookIndex];
        cashBook.isExpanded = !cashBook.isExpanded; // Toggle the isExpanded property
        setCalendarEntries(updatedCalendarEntries);
    };

    const toggleImage2 = (paymentIndex: number) => {
        const updatedPaymentEntries = [...unlinkedPayments];
        const payment = unlinkedPayments[paymentIndex];
        payment.isExpanded = !payment.isExpanded; // Toggle the isExpanded property
        setUnlinkedPayments(updatedPaymentEntries);
    };


    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleAddNewEntry = () => {
        // Logic to add new entry
        insertCashBook(); // Call the insert function
        handleCloseDialog(); // Close the dialog after adding
    };

    const updatePaymentStatus = async (paymentId: string, folderName:string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.SERVER_URL}?func=updateOpenPaymentStatus&id=${paymentId}&folderName=${folderName}&userId=${profile?.userId}`, {
                method: 'GET',
            });
    
            const data = await response.json();
            if (!data.err) {
                loadData();
                // setOpenPayment(data.openPayment);
                // console.log("openpayment reloaded");
            } else {
                alert(data.err);
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
        } finally {
            setIsLoading(false);
        }
    };
  

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">会計情報</Typography>
                {isKanji && (
                    <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                        新規追加
                    </Button>
                )}
            </Box>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <Typography variant="h6">現在の隊費: {currentBalance !== null ? `SGD ${currentBalance}` : 'N/A'}</Typography>
                    {unlinkedPayments.map((payment, paymentIndex) => { 
                        return (
                            <Card key={payment.id}>
                                <CardContent>
                                <Typography variant="h6">{payment.folderName}</Typography>
                                <>
                                    <Box sx={{display:'flex', border: '1px solid #ccc' }}>
                                        <Box sx={{ m: '2px', p: '2px', width:'100%'}}>
                                            <Box style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                                {payment.status === '未清算' ? (
                                                    <Box component="span" sx={{ color: 'orange', border: '1px solid orange', borderRadius: '4px', padding: '2px' }}>
                                                        {payment.status}
                                                    </Box>
                                                ) : payment.status === '清算済' ? (
                                                    <Box component="span" sx={{ color: 'grey', border: '1px solid grey', borderRadius: '4px', padding: '2px' }}>
                                                        {payment.status}
                                                    </Box>
                                                ) : null }
                                                <IconButton
                                                    aria-label="expand"
                                                    size="small"
                                                    onClick={() => toggleImage2(paymentIndex)}
                                                >
                                                    {!payment.isExpanded ? <ExpandMore /> : <ExpandLess /> }
                                                </IconButton>
                                            </Box>
                                            <Box sx={{ m: '2px', p: '2px', display: 'flex' }}>
                                                <AvatarIcon name={payment.userName || ''} picUrl={userMap?.values().find(user => user.displayName === payment.userName)?.pictureUrl} width={48} height={48} showTooltip={true} />
                                                <Box sx={{ m: '2px', p: '2px', display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body2">{payment?.userName}</Typography>
                                                    {/* <Typography variant="body2">{userMap?.values().find(user => user.displayName === payment.userName)?.payNow}</Typography> */}
                                                    <Typography variant="body2">金額: {payment.amount} SGD</Typography>
                                                    <Typography variant="body2">メモ: {payment.memo}</Typography>
                                                    <Typography variant="body2">申請日: {payment.uploadDate ? new Date(payment.uploadDate).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : ''}</Typography> 
                                                </Box>
                                            </Box>
                                            <Collapse in={payment.isExpanded}>
                                                {payment.image && (
                                                    <img src={payment.image} alt="関連画像" style={{ maxWidth: '100%', marginTop: '10px' }} />
                                                )}
                                            </Collapse>
                                            {isKanji && (                                            
                                            <Button 
                                                variant="contained" 
                                                color="primary"
                                                size='small'
                                                onClick={() => updatePaymentStatus(payment.id, payment.folderName)} // ボタンのクリックでステータスを更新
                                            >
                                                清算済にする
                                            </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </>                                            
                                </CardContent>
                            </Card>
                        )}
                    )}
                    {calendarEntries.map((calendar, entryIndex) => {
                        return (
                            <Card key={calendar.calendarId} >
                                <CardContent>
                                    <Typography variant="h5">{calendar.eventName}</Typography>
                                    {calendar.place && (
                                        <Typography variant="body2">場所: {calendar.place}</Typography>
                                    )}
                                    <Typography variant="body2">小計: SGD {calendar.subTotal*(-1)}</Typography>
                                    {calendar.cashBooks && calendar.cashBooks.length > 0 ? (
                                        calendar.cashBooks.map((cashBook, cashBookIndex) => {
                                            // console.log('Rendering cashBook at entryIndex:', entryIndex, 'cashBookIndex:', cashBookIndex);
                                            return (
                                                <>
                                                <Box key={cashBook.bookId} sx={{display:'flex', border: '1px solid #ccc' }}>
                                                    <Box sx={{ m: '2px', p: '2px', width:'100%'}}>
                                                        <Box style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                                            {cashBook.invoice?.status === '未清算' ? (
                                                                <Box component="span" sx={{ color: 'orange', border: '1px solid orange', borderRadius: '4px', padding: '2px' }}>
                                                                    {cashBook.invoice?.status}
                                                                </Box>
                                                            ) : cashBook.invoice?.status === '清算済' ? (
                                                                <Box component="span" sx={{ color: 'grey', border: '1px solid grey', borderRadius: '4px', padding: '2px' }}>
                                                                    {cashBook.invoice?.status}
                                                                </Box>
                                                            ) : null }
                                                            {cashBook.invoice ? (
                                                                <IconButton
                                                                    aria-label="expand"
                                                                    size="small"
                                                                    onClick={() => toggleImage(entryIndex, cashBookIndex)}
                                                                >
                                                                    {!cashBook.isExpanded ? <ExpandMore /> : <ExpandLess /> }
                                                                </IconButton>
                                                            ) : (
                                                                isKanji && (                                                                
                                                                    <IconButton aria-label="delete" size="small" onClick={() => deleteCashBook(cashBook.bookId)}>
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                )
                                                            )}
                                                        </Box>
                                                        <Box sx={{ m: '2px', p: '2px', display: 'flex' }}>
                                                            <AvatarIcon name={cashBook.payee?.displayName || ''} picUrl={cashBook.payee?.pictureUrl}  width={48} height={48} showTooltip={true} />
                                                            <Box sx={{ m: '2px', p: '2px', display: 'flex', flexDirection: 'column' }}>
                                                                <Typography variant="body2">{cashBook.payee?.displayName}</Typography>
                                                                <Typography variant="body2">金額: {cashBook.amount} SGD</Typography>
                                                                <Typography variant="body2">メモ: {cashBook.memo}</Typography>
                                                                <Typography variant="body2">申請日: {cashBook.invoice?.uploadDate ? new Date(cashBook.invoice?.uploadDate).toLocaleDateString() : new Date(cashBook.create).toLocaleDateString()}</Typography> 
                                                            </Box>
                                                        </Box>
                                                        <Collapse in={cashBook.isExpanded}>
                                                            {cashBook.invoice?.image && (
                                                                <img src={cashBook.invoice.image} alt="関連画像" style={{ maxWidth: '100%', marginTop: '10px' }} />
                                                            )}
                                                        </Collapse>                                                
                                                    </Box>
                                                </Box>
                                            </>                                            
                                            )
                                        })
                                    ) : (
                                        null                                        
                                    )}

                                </CardContent>
                            </Card>
                        );
                    })}
                    {carryOverAmount !== null && (
                        <Card sx={{ m: '2px', p: '3px' }}>
                            <CardContent>
                                <Typography variant="h6" style={{ marginTop: '20px' }}>
                                    繰り越し残高: SGD {carryOverAmount}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>新規隊費追加</DialogTitle>
                <Typography variant="caption" style={{ marginTop: '5px' }}>
                    追加額が正の数字になります（差し引きする場合マイナスで入力）
                </Typography>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="タイトル"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(e) => setNewEntry((prevEntry) => ({
                            ...prevEntry,
                            title: e.target.value,
                        }))}
                    />
                    <TextField
                        margin="dense"
                        label="メモ"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(e) => setNewEntry((prevEntry) => ({
                            ...prevEntry,
                            memo: e.target.value,
                        }))}
                    />
                    <TextField
                        margin="dense"
                        label="金額"
                        type="number"
                        fullWidth
                        variant="standard"
                        onChange={(e) => setNewEntry((prevEntry) => ({
                            ...prevEntry,
                            amount: Number(e.target.value),
                        }))}
                    />
                    {/* <Select
                        margin="dense"
                        label="カレンダーID"
                        fullWidth
                        variant="standard"
                        value={newEntry.calendarId}
                        onChange={(e) => setNewEntry((prevEntry) => ({
                            ...prevEntry,
                            calendarId: e.target.value,
                        }))}
                    >
                        {calendarMap && Array.from(calendarMap.entries()).map(([id, event]: [string, string[]]) => (
                            <MenuItem key={id} value={id}>
                                {event[2]}
                            </MenuItem>
                        ))}
                    </Select> */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        キャンセル
                    </Button>
                    <Button onClick={handleAddNewEntry} color="primary">
                        追加
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}