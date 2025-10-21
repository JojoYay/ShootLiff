import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';


interface CommentProps {
    videoUrl:string;
}

interface YTComment {
    author: string;
    comment: string;
    publishedAt: string;
}

const YouTubeComment: React.FC<CommentProps> = ({ videoUrl }) => {
    const [comments, setComments] = useState<YTComment[]>([]);

    useEffect(() => {
        fetchComments();
    }, [videoUrl]);

    const fetchComments = async () => {
        const url = process.env.NEXT_PUBLIC_SERVER_URL + `?url=${videoUrl}&func=getYTComments`;
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
            <Box sx={{maxHeight: '200px', overflow:'scroll', width:"100%", marginBottom:'10px'}}>
                {comments.map((comment, index) => {
                    return (
                        <Box key={index} sx={{ borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc', width:"100%"}}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant='caption' dangerouslySetInnerHTML={{ __html: comment.comment }}/>
                            </Box>
                            <Typography variant='caption' >{comment.author}: </Typography>
                            <Typography variant="caption" fontStyle='italic' marginLeft={'3px'}>
                                {new Date(comment.publishedAt).toLocaleString()}
                            </Typography>
                        </Box>
                    );                     
                })}
            </Box>
        </Box>
    );
};

export default YouTubeComment;