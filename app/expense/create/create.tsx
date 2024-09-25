'use client';
import { Autocomplete, Box, Button, CircularProgress, FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function CreateExpense() {
    const router = useRouter();
    const [members, setMembers] = useState<any[][]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [payNow, setPayNow] = useState('');
	// const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [receiveColumn, setReceiveColumn] = useState('false');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const url = process.env.SERVER_URL + `?func=getRegisteredMembers&func=getPayNow`;
            
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                const sortedMembers = data.members.slice(1).sort((a:any[], b:any[]) => a[0].localeCompare(b[0], 'ja-JP'));
                setMembers(sortedMembers);
                setPayNow(data.payNow)
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    //     const selectedValues = event.target.value as string[];
    //     setSelectedOptions(selectedValues);
    // };

    const defaultProps = {
        options: members.map(member => member[1]),
    };

    const generateExpenseReport = async () => {
        setLoading(true);
        try {
            let url = process.env.SERVER_URL + `?func=generateExReport`;
            console.log(selectedOptions);
            console.log(payNow);
            for(const opt of selectedOptions){
                url = url + '&users='+ encodeURIComponent(opt);
            }
            url = url + '&price='+amount;
            url = url + '&title='+encodeURIComponent(title);
            url = url + '&receiveColumn=' + receiveColumn;
            url = url + '&payNow='+encodeURIComponent(payNow);

            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                // setResult(data.url);
                router.push('/expense');
            }
        } catch (error) {
            alert(error);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            {members.length > 0 ? (
                <div style={{margin:'5px'}}>
                    <div style={{margin:'5px'}}>
                        {(!title.trim() && <Typography variant="body2" color="error">この清算の名称を入力して下さい</Typography>)}
                        <Typography variant="body2">清算タイトル:</Typography>
                        <TextField type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" />
                    </div>
                    <Box
                        sx={{
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '10px',
                            margin: '5px',
                        }}
                    >
                        <Typography variant="subtitle1" gutterBottom>清算対象を選択 {selectedOptions.length} 件</Typography>
                        {selectedOptions.length === 0 && (
                            <Typography variant="body2" color="error" gutterBottom>対象を選択してください</Typography>
                        )}
                        <Autocomplete
                            {...defaultProps}
                            id="memberCombo"
                            multiple
                            disableCloseOnSelect
                            sx={{ width: '100%' }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="伝助上の名称を選択" 
                                    variant="standard"
                                    error={selectedOptions.length === 0}
                                />
                            )}
                            onChange={(event, value) => setSelectedOptions(value)}
                            value={selectedOptions}
                        />
                    </Box>
                    <div style={{margin:'5px'}}>
                        {(!amount.trim() && <Typography variant="body2" color="error">金額を入力して下さい</Typography>)}
                        <Typography variant="body2">とりあえずの金額（一人当たり）:</Typography>
                        <TextField type="text" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
                    </div>
                    <div style={{margin:'5px'}}>
                        {(!payNow.trim() && <Typography variant="body2" color="error">PayNow先を入力して下さい</Typography>)}
                        <Typography variant="body2">PayNow先を入力:
                        </Typography>
                        <TextField type="text" id="paynow" value={payNow} onChange={(e) => setPayNow(e.target.value)} placeholder="Enter PayNow" />
                    </div>
                    <div style={{margin:'5px'}}>
                        <FormControl 
                            component="fieldset" 
                            sx={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '10px',
                                '& .MuiFormLabel-root': {
                                    backgroundColor: 'white',
                                    padding: '0 5px',
                                    marginTop: '-20px'
                                }
                            }}
                        >
                            <FormLabel component="legend">受け取りカラム</FormLabel>
                            <RadioGroup
                                aria-label="receive-column"
                                name="receive-column"
                                value={receiveColumn}
                                onChange={(e) => setReceiveColumn(e.target.value)}
                            >
                                <FormControlLabel value="true" control={<Radio />} label="表示する" />
                                <FormControlLabel value="false" control={<Radio />} label="表示しない" />
                            </RadioGroup>
                        </FormControl>
                    </div>                    
                    <div style={{margin:'5px'}}>
                        <Button onClick={generateExpenseReport} variant="contained" disabled={loading}>
                            {loading ? 'Loading...' : '送信'}
                        </Button>
                    </div>
                    {/* <div style={{margin:'5px'}}>
                        {result && <div dangerouslySetInnerHTML={{ __html: result }}></div>}
                    </div> */}
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Loading Form... </div>
                    <CircularProgress />
                </div>
            )}
        </>
    );
}