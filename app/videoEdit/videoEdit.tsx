'use client';
//つかってないので消してよい　jittee側に移しました
import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Chip,
    Alert,
    Tooltip
} from '@mui/material';
import { useLiff } from '../liffProvider';
import { 
    VideoLibrary, 
    Movie, 
    Upload, 
    Folder, 
    Refresh,
    PlayArrow
} from '@mui/icons-material';
import LoadingSpinner from '../calendar/loadingSpinner';
import { User } from '../types/user';

interface DriveFolder {
    id: string;
    name: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string;
    size?: string;
    fileCount?: number;
    fileNames?: string[];
    subFolderNames?: string[];
    hasResultFolder?: boolean;
    hasYouTubeFolder?: boolean;
}

export default function VideoEdit() {
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [lang, setLang] = useState<string>('ja-JP');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // タスクの種類定義
    const taskTypes = [
        { value: 'merge', label: '動画統合', icon: <VideoLibrary />, color: '#1976d2' },
        { value: 'goal', label: 'ゴールシーン作成', icon: <Movie />, color: '#f57c00' },
        { value: 'upload', label: 'YouTubeアップロード', icon: <Upload />, color: '#d32f2f' }
    ];

    const { liff } = useLiff();

    useEffect(() => {
        if (liff) {
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    setLang(liff.getLanguage());
                });
            }
        }
    }, [liff]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // GoogleDriveの情報を取得
            let url = process.env.SERVER_URL + `?func=loadVideoFolders`;
            
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Response data:', data);

                // フォルダー情報の処理
                let folderData = [];
                
                if (data.videoFolders && Array.isArray(data.videoFolders)) {
                    folderData = data.videoFolders;
                } else if (data.resultList && Array.isArray(data.resultList)) {
                    folderData = data.resultList;
                } else if (Array.isArray(data) && data.length > 0 && data[0] && data[0].id) {
                    folderData = data;
                }

                if (folderData.length > 0) {
                    const processedFolders: DriveFolder[] = folderData
                        .filter((item: any) => item && item.id) // 有効なデータのみフィルタ
                        .map((item: any) => ({
                            id: item.id,
                            name: item.title,
                            createdTime: item.createdTime,
                            modifiedTime: item.modifiedTime,
                            webViewLink: item.url,
                            fileCount: item.fileCount || 0,
                            fileNames: item.fileNames || [],
                            subFolderNames: item.subFolderNames || [],
                            hasResultFolder: item.hasResultFolder || false,
                            hasYouTubeFolder: item.hasYouTubeFolder || false
                        }));
                    
                    // processed_videosフォルダを除外
                    const filteredFolders = processedFolders.filter(folder => 
                        folder.name !== 'processed_videos'
                    );
                    
                    // フォルダ名順でソート
                    const sortedFolders = filteredFolders.sort((a, b) => 
                        a.name.localeCompare(b.name, 'ja-JP', { numeric: true, sensitivity: 'base' })
                    );
                    
                    setFolders(sortedFolders);
                }

                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsLoading(false);
        }
    };

    const truncateFileName = (fileName: string, maxLength: number = 30) => {
        if (fileName.length <= maxLength) {
            return fileName;
        }
        const extension = fileName.split('.').pop();
        const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExtension.substring(0, maxLength - extension!.length - 4) + '...';
        return `${truncatedName}.${extension}`;
    };

    const truncateFolderName = (folderName: string, maxLength: number = 40) => {
        if (folderName.length <= maxLength) {
            return folderName;
        }
        return folderName.substring(0, maxLength - 3) + '...';
    };

    const handleGlobalTask = (taskType: string) => {
        console.log(`グローバルタスク実行: ${taskType}`);
        
        // 全フォルダに対してタスクを実行
        handleVideoTask('1Yr4NsedItfew0cQSeG2vZl8kJFdVZL4i', taskType, 'Video');
    };

    const handleTaskExecution = (folderId: string, taskType: string, folderName: string) => {
        console.log(`実行: ${taskType} for folder: ${folderName} (${folderId})`);
        
        // 汎用的なVideoTask実行メソッドを呼び出し
        handleVideoTask(folderId, taskType, folderName);
    };

    const getTaskDisplayName = (taskType: string) => {
        switch (taskType) {
            case 'goal': return 'ゴール集作成';
            case 'merge': return '動画統合';
            case 'upload': return 'YouTubeアップロード';
            default: return '動画処理';
        }
    };

    const handleVideoTask = async (folderId: string, taskType: string, folderName: string) => {
        try {
            const taskDisplayName = getTaskDisplayName(taskType);
            
            // Google Colabでタスクを実行
            const confirmed = window.confirm(
                `${taskDisplayName}を開始します。\n\n` +
                `フォルダ: ${folderName}\n` +
                `Google Colabでノートブックを開きますか？`
            );
            
            if (confirmed) {
                // サーバーサイドAPIを呼び出してColabノートブックのURLを取得
                const url = process.env.SERVER_URL + 
                    `?func=executeVideoTask&folderId=${folderId}&folderName=${encodeURIComponent(folderName)}&taskType=${taskType}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // 新しいタブでColabを開く
                    console.log(data.colabUrl);
                    window.open(data.colabUrl, '_blank');
                    
                    alert(data.message);
                    console.log(`${taskDisplayName}のColabノートブックが開かれました`);
                } else {
                    throw new Error(data.error || `${taskDisplayName}でエラーが発生しました`);
                }
            }
        } catch (error) {
            console.error(`${taskType}タスクエラー:`, error);
            alert(`${getTaskDisplayName(taskType)}でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const refreshData = async () => {
        setIsLoading(true);
        await fetchData();
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Box sx={{ display: "flex", flexDirection: 'column', p: 2 }}>
            <Typography variant="h4" component="div" sx={{ textAlign: 'center', color: '#3f51b5', mb: 3 }}>
                {lang === 'ja-JP' ? '動画編集管理' : 'Video Edit Management'}
            </Typography>

            {/* グローバルタスクボタン */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    startIcon={<VideoLibrary />}
                    onClick={() => handleGlobalTask('merge')}
                    sx={{ 
                        backgroundColor: '#1976d2',
                        '&:hover': {
                            backgroundColor: '#1976d2',
                            opacity: 0.8
                        }
                    }}
                >
                    {lang === 'ja-JP' ? '動画統合' : 'Video Merge'}
                </Button>
                <Button
                    variant="contained"
                    startIcon={<Movie />}
                    onClick={() => handleGlobalTask('goal')}
                    sx={{ 
                        backgroundColor: '#f57c00',
                        '&:hover': {
                            backgroundColor: '#f57c00',
                            opacity: 0.8
                        }
                    }}
                >
                    {lang === 'ja-JP' ? 'ゴール集作成' : 'Goal Creation'}
                </Button>
            </Box>

            {/* コントロール */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#757575' }}>
                    {lang === 'ja-JP' ? 'Driveフォルダ一覧' : 'Drive Folders'}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={refreshData}
                    size="small"
                >
                    {lang === 'ja-JP' ? '更新' : 'Refresh'}
                </Button>
            </Box>

            {/* フォルダ一覧 */}
            {folders.map((folder) => {
                return (
                    <Paper key={folder.id} elevation={2} sx={{ mb: 2 }}>
                        <Box sx={{ p: 2 }}>
                            {/* フォルダ情報 */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1, minWidth: 0 }}>
                                    <Folder sx={{ color: '#1976d2', mt: 0.5, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Tooltip title={folder.name} arrow>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, wordBreak: 'break-word' }}>
                                                {truncateFolderName(folder.name)}
                                            </Typography>
                                        </Tooltip>
                                        <Typography variant="body2" sx={{ color: '#757575', mb: 1 }}>
                                            {lang === 'ja-JP' ? 'ファイル数' : 'Files'}: {folder.fileCount || 0}
                                        </Typography>
                                        
                                        {/* ステータスバッジ */}
                                        {(folder.hasResultFolder || folder.hasYouTubeFolder) && (
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                {folder.hasResultFolder && (
                                                    <Chip
                                                        label={lang === 'ja-JP' ? 'ビデオ処理済み' : 'Video Processed'}
                                                        size="small"
                                                        color="success"
                                                        variant="filled"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                )}
                                                {folder.hasYouTubeFolder && (
                                                    <Chip
                                                        label={lang === 'ja-JP' ? 'YouTubeアップ済み' : 'YouTube Uploaded'}
                                                        size="small"
                                                        color="error"
                                                        variant="filled"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                        )}
                                        {/* ファイル一覧 */}
                                        {folder.fileNames && folder.fileNames.length > 0 ? (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 'bold' }}>
                                                    {lang === 'ja-JP' ? 'ファイル一覧:' : 'Files:'}
                                                </Typography>
                                                <Box sx={{ mt: 0.5 }}>
                                                    {folder.fileNames.map((fileName, index) => (
                                                        <Tooltip key={index} title={fileName} arrow>
                                                            <Chip
                                                                label={truncateFileName(fileName)}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ 
                                                                    mr: 0.5, 
                                                                    mb: 0.5, 
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: '#f5f5f5',
                                                                    maxWidth: '300px'
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Alert severity="warning" sx={{ mt: 1, maxWidth: 400 }}>
                                                {lang === 'ja-JP' ? 'このフォルダにはファイルがありません' : 'No files in this folder'}
                                            </Alert>
                                        )}
                                    </Box>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    href={folder.webViewLink}
                                    target="_blank"
                                    startIcon={<PlayArrow />}
                                    sx={{ 
                                        flexShrink: 0,
                                        minWidth: 'auto',
                                        fontSize: '0.75rem',
                                        px: 1,
                                        py: 0.5
                                    }}
                                >
                                    {lang === 'ja-JP' ? 'Drive' : 'Drive'}
                                </Button>
                            </Box>

                            {/* タスクボタン */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#757575', mb: 1 }}>
                                    {lang === 'ja-JP' ? '実行可能なタスク' : 'Available Tasks'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: '100%' }}>
                                    {taskTypes.map((taskType) => {
                                        // 動画統合とゴール集作成はグローバルボタンで処理するため表示しない
                                        if (taskType.value === 'merge' || taskType.value === 'goal') {
                                            return null;
                                        }

                                        // タスクが完了済みかどうかをチェック
                                        const isTaskCompleted = taskType.value === 'upload' && folder.hasYouTubeFolder;
                                        
                                        return (
                                            <Tooltip
                                                key={taskType.value}
                                                title={isTaskCompleted ? 'このタスクは既に完了済みです' : ''}
                                                arrow
                                            >
                                                <span>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={taskType.icon}
                                                        disabled={isTaskCompleted}
                                                        onClick={() => handleTaskExecution(folder.id, taskType.value, folder.name)}
                                                        sx={{ 
                                                            backgroundColor: isTaskCompleted ? '#ccc' : taskType.color,
                                                            fontSize: '0.75rem',
                                                            px: 1.5,
                                                            py: 0.5,
                                                            minWidth: 'auto',
                                                            '&:hover': {
                                                                backgroundColor: isTaskCompleted ? '#ccc' : taskType.color,
                                                                opacity: isTaskCompleted ? 1 : 0.8
                                                            },
                                                            '&:disabled': {
                                                                backgroundColor: '#ccc',
                                                                color: '#666'
                                                            }
                                                        }}
                                                    >
                                                        {taskType.label}
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                );
            })}

            {folders.length === 0 && (
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: '#757575' }}>
                        {lang === 'ja-JP' ? 'フォルダが見つかりません' : 'No folders found'}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
} 