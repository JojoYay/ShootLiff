import React from 'react';
import { Box } from '@mui/material';

const LoadingSpinner: React.FC = () => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <Box sx={{
                '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            }}>
                <img
                    src="https://lh3.googleusercontent.com/d/1_dFkD99lTQeQEFVwWfIBadXkApYGBGmt"
                    alt="ローディング"
                    style={{
                        width: '48px',
                        height: '48px',
                        animation: 'spin 4s linear infinite',
                    }}
                />
            </Box>
        </Box>
    );
};

export default LoadingSpinner;