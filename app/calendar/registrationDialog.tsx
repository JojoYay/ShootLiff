import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

interface RegistrationDialogProps {
    nickname: string;
    onNicknameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRegister: () => void;
    nicknameError: string;
    disabledM: boolean;
    onClose: () => void; // ダイアログを閉じるための関数を追加
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ nickname, onNicknameChange, onRegister, nicknameError, disabledM }) => {
    return (
        <Dialog open={true} onClose={() => {}}>
            <DialogTitle>New Registration</DialogTitle>
            <DialogContent>
                <TextField
                    label="Nickname"
                    value={nickname}
                    onChange={onNicknameChange}
                    error={!!nicknameError}
                    helperText={nicknameError}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onRegister} color="primary" disabled={disabledM}>
                    Register
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegistrationDialog;