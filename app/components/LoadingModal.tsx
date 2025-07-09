import React from 'react';
import { Dialog, DialogContent, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingModalProps {
    open: boolean;
    message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ open, message }) => {
    return (
        <Dialog
            open={open}
            PaperProps={{
                style: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                },
            }}
            sx={{
                '& .MuiDialog-container': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
            }}
        >
            <DialogContent>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <CircularProgress sx={{ color: 'white', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>
                        {message || '処理完了までお待ちください'}
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default LoadingModal; 