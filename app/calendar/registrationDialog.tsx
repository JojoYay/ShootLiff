import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { User, JsonUser } from '../types/user';

interface RegistrationDialogProps {
    nickname: string;
    onNicknameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // onRegister: () => void;
    nicknameError: string;
    setNicknameError: (err:string) => void;
    // disabled: boolean;
    // onClose: () => void; // ダイアログを閉じるための関数を追加
    users: JsonUser[];
    profile: User | null;
    setShowRegistrationDialog: (boo:boolean) => void;
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ nickname, onNicknameChange, nicknameError, setNicknameError, users, profile, setShowRegistrationDialog}) => {
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegister = async() => {
        setIsRegistering(true); // 登録処理開始時にtrueにする
        console.log(isRegistering);
        try{
            const isNameTaken = users.some(user => user["伝助上の名前"] === nickname);
            if (isNameTaken) {
                setNicknameError('This nickname is already in use.');
            } else {
                const formData = new FormData();
                formData.append('func', 'registrationFromApp');
                formData.append('userId', profile?.userId || '');
                formData.append('nickname', nickname);
                formData.append('line_name',profile?.displayName || '');
                formData.append('pic_url', profile?.pictureUrl || '');
                if(process.env.NEXT_PUBLIC_SERVER_URL){
                    await fetch(process.env.NEXT_PUBLIC_SERVER_URL, {
                        method: 'POST',
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Registration successful:', data);
                        setShowRegistrationDialog(false); // 成功時にダイアログを閉じる
                        setIsRegistering(false); // 成功時にfalseに戻す
                    })
                    .catch(error => {
                        console.error('Registration failed:', error);
                        setIsRegistering(false); // エラー時にもfalseに戻す
                    });
                }
            }
        } finally {
            setIsRegistering(false);
        }
    };

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
                <Button onClick={handleRegister}
                    color="primary"
                    disabled={isRegistering}
                    variant="contained" 
                    >
                    Register
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegistrationDialog;