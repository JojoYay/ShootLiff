'use client';
import { Autocomplete, Button, CircularProgress, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

export default function CreateExpense() {
    const [members, setMembers] = useState<any[][]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
	const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const url = process.env.SERVER_URL + `?func=getRegisteredMembers`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                // const newOptions = data.result.map(member => ({ label: member[1], value: member[2] }));
                // const newOptions = data.result.map((member: [string, string, string, string, string]) => (member[1], member[2] ));
                const sortedMembers = data.members.slice(1).sort((a:any[], b:any[]) => a[0].localeCompare(b[0], 'ja-JP'));
                setMembers(sortedMembers);
                // setMembers(data.members);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
        const selectedValues = event.target.value as string[];
        setSelectedOptions(selectedValues);
    };

    const defaultProps = {
        options: members.map(member => member[1]),
        // getOptionLabel: (member: string) => member,
    };

    const generateExpenceReport = async () => {
        setLoading(true);
        try {
            let url = process.env.SERVER_URL + `?func=generateExReport`;
            console.log(selectedOptions);
            for(const opt of selectedOptions){
                url = url + '&users='+ encodeURIComponent(opt);
            }
            url = url + '&price='+amount;
            url = url + '&title='+encodeURIComponent(title);

            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                // console.log(data);
                setResult(data.url);
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
                    <Typography>清算する対象を選択 {selectedOptions.length} 件</Typography>
                    <Autocomplete
                        {...defaultProps}
                        // options = {members}
                        id="memberCombo"
                        multiple
                        disableCloseOnSelect
                        sx={{ width: '100%' }}
                        // renderInput={(params) => (
                        //     <TextField {...params} label={params.value[0]} variant="standard" value={params[1]} />
                        // )}

                        renderInput={(params) => (
                            <TextField {...params} label="伝助上の名称を選択" variant="standard" />
                        )}
                        onChange={(event, value) => setSelectedOptions(value)}
                    />
                    <div style={{margin:'5px'}}>
                        {(!amount.trim() && <Typography variant="body2" color="error">金額を入力して下さい</Typography>)}
                        <Typography variant="body1">金額（一人当たり）:</Typography>
                        <TextField type="text" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
                    </div>
                    <div style={{margin:'5px'}}>
                        {(!title.trim() && <Typography variant="body2" color="error">支払い名称を入力して下さい</Typography>)}
                        <Typography variant="body2">支払い名称:</Typography>
                        <TextField type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" />
                    </div>
                    <div style={{margin:'5px'}}>
                        <Button onClick={generateExpenceReport} variant="contained" disabled={loading}>
                            {loading ? 'Loading...' : '送信'}
                        </Button>
                    </div>
                    <div style={{margin:'5px'}}>
                        {result && <div dangerouslySetInnerHTML={{ __html: result }}></div>}
                    </div>
                    {/* <div>
                        <Typography>Selected Options: {selectedOptions.join(', ')}</Typography>
                        <Typography>Amount: {amount}</Typography>
                        <Typography>Title: {title}</Typography>
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