import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AvatarIcon from '../stats/avatarIcon';

interface Profile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

interface CommentProps {
    componentId: string;
    category: string;
    users: string[][]; // ユーザー情報
    user: Profile; // 現在のユーザーID
    lang:string;
}

const Comment: React.FC<CommentProps> = ({ componentId, category, users, user, lang }) => {
    const [comments, setComments] = useState<string[][]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // 追加

    useEffect(() => {
        fetchComments();
    }, [componentId, category]);

    const fetchComments = async () => {
        const url = process.env.SERVER_URL + `?component_id=${componentId}&category=${category}&func=getComments`;
        if (url) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                // console.log(data);
                setComments(data.comments);
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        }
    };

    const handleCommentSubmit = async () => {
        if (newComment.trim() && !isSubmitting) { // 変更
            setIsSubmitting(true); // 追加
            try {
                const formData:FormData = new FormData();
                formData.append('component_id', componentId);
                formData.append('category', category);
                formData.append('content', newComment);
                formData.append('create_user', user.userId);
                formData.append('func', 'insertComments');

                for (const pair of Array.from(formData.entries())) {
                    console.log(pair[0] + ', ' + pair[1]);
                }

                let url = process.env.SERVER_URL;
                if (url) {
                    const response = await fetch(url, {
                        method: 'POST',
                        body: formData
                    });
    
                    if (response.ok) {
                        setNewComment('');
                        fetchComments();
                    }
                }
            } catch (error) {
                console.error('Error submitting comment:', error);
            } finally {
                setIsSubmitting(false); // 追加
            }
        }
    };

    const handleCommentDelete = async (commentId: string) => {
        if (isSubmitting) return; // 追加
        const de = lang === 'ja-JP' ? 'このコメントを削除しますか？' : 'Proceed to delete?'
        if (!window.confirm(de)) return; // 追加
        setIsSubmitting(true); // 追加
        try {
            const formData:FormData = new FormData();
            formData.append('id', commentId);
            formData.append('func', 'deleteComments');
            let url = process.env.SERVER_URL;
            if (url) {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    setNewComment('');
                    fetchComments();
                }
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    function renderWithLinks(remark: string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = remark.split(urlRegex);
    
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                        {part}
                    </a>
                );
            }
            return part;
        });
    }


    return (
        <Box>                                                    
            <Typography variant="h6" sx={{ color: '#3f51b5' }}>{lang === 'ja-JP' ? 'コメント' : 'Comments'}</Typography>
            <Box sx={{maxHeight: '400px', overflow:'scroll'}}>
                {comments.map((comment) => {
                    console.log(users);
                    console.log(comment);
                    const createUser = users.find(u => u[2] === comment[3]);
                    // const user = users.find(u => u.id === comment.create_user);
                    console.log(createUser);
                    return createUser ? (
                        
                        <Box key={comment[0]} sx={{ border: '1px solid #ccc', padding: '5px', marginBottom: '3px'}}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {user && (
                                    <AvatarIcon 
                                        picUrl={createUser[4]} 
                                        name={createUser[1]} 
                                        width={24}
                                        height={24}
                                        showTooltip={true} 
                                    />
                                )}
                                <Typography marginLeft={'3px'}>{renderWithLinks(comment[4])}</Typography>
                                {user.userId === comment[3] && (
                                    <IconButton 
                                    onClick={() => handleCommentDelete(comment[0])} 
                                    size="small" 
                                    sx={{ marginLeft: 'auto' }} 
                                    disabled={isSubmitting}
                                >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                            <Typography variant="caption" fontStyle='italic' marginLeft={'3px'}>
                                {new Date(comment[5]).toLocaleString()}
                            </Typography>
                        </Box>
                    ) : null;
                })}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    label={lang === 'ja-JP' ? 'コメントを追加' : 'Add a comment'}
                    variant="outlined"
                    fullWidth
                    size='small'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    sx={{ marginBottom: 1 }}
                />
                <Button variant="contained" onClick={handleCommentSubmit} disabled={isSubmitting} size='small' style={{marginLeft:'2px'}}>
                   {lang === 'ja-JP' ? '投稿' : 'Post'}
                </Button>
            </Box>
        </Box>
    );
};

export default Comment;