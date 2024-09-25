'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, CardActions, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid,IconButton,Paper, Typography } from '@mui/material';
import { Profile } from '@liff/get-profile';
import { useLiff } from '@/app/liffProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TableChartIcon from '@mui/icons-material/TableChart';
// Existing code for InputExpense component

export default function ExpenseList() {
    const router = useRouter();
    // const [file, setFile] = useState<File | null>(null);
    // const [src, setSrc] = useState<string>('');
    // const [amount, setAmount] = useState('');
	const { liff } = useLiff();
	const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    // const [result, setResult] = useState('');
    const [info, setInfo] = useState<ExpenseItem[]>([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

	if (liff) {
		liff.ready.then(() => {
			if (!liff.isLoggedIn()) {
				liff.login({ redirectUri: window.location.href });
			}
		})
	}

    useEffect(() => {
        if(profile){
            loadExList();
        }
    }, [profile])

	useEffect(() => {
		console.log("Liff login (register page)");
		if (liff?.isLoggedIn()) {
			(async () => {
				const prof = await liff.getProfile();
				setProfile(prof);
			})();
		}
	}, [liff]);

    const loadExList = async () => {
        setLoading(true);
        setInfo([]);
        const formData = new FormData();
        if (profile) {
            formData.append('func', 'loadExList');
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
                    setInfo(data.resultList);
                    console.log(data);

                } catch (error) {
                    console.error('Error loading Expense list:', error);
                    // setResult('Error uploading file:'+error);
                } finally {
                    setLoading(false);
                }
            }
                // }
            // };
        } else {
            setLoading(false);
        }
    };
    const handleCreateNew = () => {
        router.push('/expense/create');
    };

    interface ExpenseItem {
        title: string;
        url: string;
    }

    const handleDeleteClick = (title: string) => {
        setItemToDelete(title);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            // Implement actual delete functionality here
            console.log('Deleting', itemToDelete);
            deleteEx(itemToDelete);
            
        }
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const deleteEx = async (title:string) => {
        setLoading(true);
        const formData = new FormData();
        if (profile) {
            formData.append('func', 'deleteEx');
            formData.append('title',title);
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
                    // setInfo(data.resultList);
                    console.log(data);
                } catch (error) {
                    console.error('Error loading Expense list:', error);
                    // setResult('Error uploading file:'+error);
                } finally {
                    setLoading(false);
                    // After deletion, you might want to refresh the list
                    loadExList();
                }
            }
        } else {
            setLoading(false);
        }
    };


    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleGoInput = (title: string) => {
        router.push('/expense/input?title='+title);
    };

    const handleOpenSpreadsheet = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <>
        {info.length > 0 ? (
        <div>
            <div style={{margin:'5px'}}>
                <Button variant="contained" color="primary" onClick={handleCreateNew} disabled={loading}>新規作成</Button>
            </div>
            <Grid container spacing={2}>
                {info.map((infoElement, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" noWrap>
                                    {infoElement.title}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <IconButton aria-label="goInput" onClick={() => handleGoInput(infoElement.title)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton aria-label="spreadsheet" onClick={() => handleOpenSpreadsheet(infoElement.url)}>
                                    <TableChartIcon />
                                </IconButton>
                                <IconButton aria-label="delete" onClick={() => handleDeleteClick(infoElement.title)}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog
                open={deleteConfirmOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"削除の確認"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        「{itemToDelete}」を削除しますか？
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>キャンセル</Button>
                    <Button onClick={handleDeleteConfirm} autoFocus>
                        削除
                    </Button>
                </DialogActions>
            </Dialog>


            {/* <div style={{margin:'5px'}}>
                {result && <div dangerouslySetInnerHTML={{ __html: result }} style={{ maxWidth: '100%', display: result ? 'block' : 'none' }}></div>}
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

