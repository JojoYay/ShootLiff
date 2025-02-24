'use client';
// import { AssistWalker } from '@mui/icons-material';
import {
    Avatar,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';


export default function ScoreInput() {
    const [teams, setTeams] = useState<string[][] | null>(null);
    const [users, setUsers] = useState<string[][] | null>(null);
    const [scores, setScores] = useState<string[][] | null>(null);
    const [videos, setVideos] = useState<string[][] | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null); // 選択された試合
    const [team1Players, setTeam1Players] = useState<string[]>([]); // チーム1の選手リスト
    const [team2Players, setTeam2Players] = useState<string[]>([]); // チーム2の選手リスト
    const [team1Helper, setTeam1Helper] = useState<string | null>(null); // チーム1の助っ人
    const [team2Helper, setTeam2Helper] = useState<string | null>(null); // チーム2の助っ人
    const [currentGoal, setCurrentGoal] = useState<{
        scoreId: string | null, // 追加: scoreId
        scorer: string | null,
        assister: string | null,
        team: string | null
    }>({
        scoreId: null, // 初期値はnull
        scorer: null,
        assister: null,
        team: null
    });
    const [matchScores, setMatchScores] = useState<{
        id: string, // 追加: ID
        scorer: string,
        assister: string | null,
        team: string
    }[]>([]); // 試合中のスコア記録
    const [editMode, setEditMode] = useState<'add' | 'edit' | 'delete'>('add'); // 'add', 'edit', 'delete' モード
    const [isSaving, setIsSaving] = useState<boolean>(false); // Saving flagを追加
    const [isEndMatchDialogOpen, setIsEndMatchDialogOpen] = useState<boolean>(false); // ダイアログの表示状態
    const [dialogWinningTeam, setDialogWinningTeam] = useState<string | null>(null); // ダイアログで選択された勝利チーム
    const [selectedMatchType, setSelectedMatchType] = useState<string | null>('3'); // 選択された試合タイプ
    const [isCreatingMatch, setIsCreatingMatch] = useState<boolean>(false); // 試合作成中フラグ


    useEffect(() => {
        fetchScores();
    }, []);

    useEffect(() => {
        if (selectedVideo && scores) {
            updateMatchScores(selectedVideo, scores);
        }
    }, [selectedVideo, scores]);

    const updateMatchScores = (selectedVideo: string, scores: string[][]) => {
        const filteredScores = scores.filter(score => score[1] === selectedVideo); // score[1]がvideoId
        const formattedScores = filteredScores.map(score => ({
            id: score[0], // score[0]がscoreId
            team: score[2], // score[2]がteam
            scorer: score[4], // score[4]がscorer
            assister: score[3] === 'null' ? null : score[3], // score[3]がassister
        }));
        setMatchScores(formattedScores);
    };

    const fetchScores = async (videoUnselect:boolean=false) => {
        try {
            if(videoUnselect){
                setSelectedVideo(null);
                setTeam1Players([]);
                setTeam2Players([]);
                setVideos(null);
                setTeams(null);
            }
            // const url = process.env.SERVER_URL + `?func=getTeams&func=getUsers&func=getVideo&func=getScores`;
            let url = process.env.SERVER_URL + `?func=getTeams&func=getUsers&func=getTodayMatch&func=getScores`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data.teams);
                setTeams(data.teams as string[][]);
                setUsers(data.users as string[][]);
                console.log(data.match);
                console.log(data.scores);
                // console.log(data);

                setVideos(data.match as string[][]);
                setScores(data.scores as string[][]);

                // data.teamsの2列目のチーム数に応じて試合タイプを選択
                if (data.matchCount && data.matchCount.length > 0) {
                    setSelectedMatchType(data.matchCount);
                }

            }
            // url = process.env.SERVER_URL + `?func=getTodayMatch&func=getScores`;
            // if (url) {
            //     const response = await fetch(url, {
            //         method: 'GET',
            //     });
            //     const data = await response.json();
                // console.log(data.match);
                // console.log(data.scores);
                // // console.log(data);

                // setVideos(data.match as string[][]);
                // setScores(data.scores as string[][]);
            // }
        } catch (error) {
            console.error('Error fetching Teams:', error);
        }
    };
    // 試合選択時の処理
    const handleVideoSelect = (event: any) => {
        setSelectedVideo(event.target.value);
        // 選択された試合に基づいてチームと選手を抽出
        if (videos && teams && event.target.value) {
            const selectedVideoData = videos.find(video => video[10] === event.target.value); // 選択されたビデオのデータ
            if (selectedVideoData) {
                // const team1Name = selectedVideoData[7]; // 7行目のチーム名
                // const team2Name = selectedVideoData[8]; // 8行目のチーム名

                const team1PlayersList: string[] = selectedVideoData[5].split(', ');
                const team2PlayersList: string[] = selectedVideoData[6].split(', ');

                setTeam1Players(team1PlayersList);
                setTeam2Players(team2PlayersList);
                setTeam1Helper(null); // 助っ人をリセット
                setTeam2Helper(null); // 助っ人をリセット                
            }
        }
    };

    const UserCard = ({userName, imageUrl}: {
        userName: string,
        // isUnassigned?: boolean,
        imageUrl?: string | null
    }) => (
        // ... existing UserCard component ...
        // ... 変更なし ...
        <Card sx={{
            minWidth: 100,
            margin: 1,
            backgroundColor: 'white', // 選択状態の背景色を削除
            // minHeight: isUnassigned ? '50px' : 'auto', // 未所属の場合のみ高さを固定
            // maxHeight: isUnassigned ? '50px' : 'auto', // 未所属の場合のみ高さを固定
            // overflowY: isUnassigned ? 'scroll' : 'hidden', // 未所属の場合のみスクロールバーを表示
        }} >
            <CardActionArea>
                <CardContent sx={
                    {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '5px'
                    }
                } >
                    <Avatar alt={
                            userName
                        }
                        src={
                            imageUrl || undefined
                        } // imageUrlがなければAvatarを表示しない
                        sx={
                            {
                                width: 24,
                                height: 24,
                                marginRight: 1
                            }
                        }
                    /> <Typography variant="h6"
                        component="div" > {
                            userName
                        }
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );

    const TeamSection = ({
        teamNumber,
        teamName,
        players
    }: {
        teamNumber: number,
        teamName: string,
        players: string[]
    }) => (
        <Grid item xs={12} sm={6} md={4} key={teamNumber} >
            <Typography variant="h6"
                component="div"
                sx={{textAlign: 'center', mb: 1, fontWeight: 'bold'}} > 
                {teamName} 
            </Typography>
            <Card sx={{
                    margin : 1,
                    minHeight: 150,
                    padding: '1px',
                    textAlign: 'center',
                    backgroundColor: '#f0f0f0',
                }}>
                <div style={
                    {
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }
                } > {
                        players.map(player => {
                            const userData = users?.find(user => user[1] === player); // ユーザー名でusersデータから検索
                            const imageUrl = userData?.[4] || null; // 5列目のURLを取得、存在しない場合はnull
                            // console.log("user:"+userData);
                            return (<UserCard key={
                                player
                            }
                                userName={
                                    player
                                }
                                imageUrl={
                                    imageUrl
                                }
                            /> // imageUrlをpropsとして渡す
                            );
                        })
                    } 
                </div> 

                <FormControl fullWidth margin="normal">
                    <InputLabel id={`helper-select-label-${teamNumber}`}>助っ人追加</InputLabel>
                    <Select
                        size='small'
                        labelId={`helper-select-label-${teamNumber}`}
                        id={`helper-select-${teamNumber}`}
                        value={teamNumber === 1 ? team1Helper || '' : team2Helper || ''}
                        label="助っ人追加"
                        onChange={(e) => {
                            const helperName = e.target.value as string;
                            // const helperData = users?.find(user => user[1] === helperName);
                            if (teamNumber === 1) {
                                setTeam1Helper(helperName);
                                setTeam1Players(prevPlayers => [...prevPlayers, helperName]); // 助っ人をチームに追加
                            } else {
                                setTeam2Helper(helperName);
                                setTeam2Players(prevPlayers => [...prevPlayers, helperName]); // 助っ人をチームに追加
                            }
                        }}
                        displayEmpty={(teamNumber === 1 && team1Helper !== null) || (teamNumber === 2 && team2Helper !== null)}

                    >
                    {teams && users && teams.slice(1).map(team => team[0]).filter(playerName =>
                            playerName &&
                            !team1Players.includes(playerName) &&
                            !team2Players.includes(playerName)
                        ).map((playerName) => (
                            <MenuItem key={playerName} value={playerName}>{playerName}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {(teamNumber === 1 && team1Helper) || (teamNumber === 2 && team2Helper) ? (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                            if (teamNumber === 1) {
                                setTeam1Players(prevPlayers => prevPlayers.filter(player => player !== team1Helper)); // 助っ人を削除
                                setTeam1Helper(null);
                            } else {
                                setTeam2Players(prevPlayers => prevPlayers.filter(player => player !== team2Helper)); // 助っ人を削除
                                setTeam2Helper(null);
                            }
                        }}
                    >
                        助っ人削除
                    </Button>
                ) : null}

            </Card>
        </Grid>
    );

    // ゴール追加処理
    const handleAddGoal = async () => {
        if (currentGoal.scorer && currentGoal.team && selectedVideo && videos) {
            setIsSaving(true); // saving開始時にtrueにする
            const team:string = currentGoal.team!;
            const scorer:string = currentGoal.scorer!;
            const assister:string = currentGoal.assister? currentGoal.assister : '';
            const selectedVideoData = videos.find(video => video[10] === selectedVideo);
            const videoId = selectedVideoData?.[10];

            setCurrentGoal({ // 入力フォームをリセット
                scoreId: null,
                scorer: null,
                assister: null,
                team: null
            });

            if (!videoId) {
                alert('試合IDが見つかりません。試合を選択してください。');
                return;
            }

            const form:FormData = new FormData();
            form.append('matchId', videoId);
            form.append('team', team);
            form.append('scorer', scorer);
            form.append('assister', assister);

            let apiUrl = '';
            let method = 'POST'; // デフォルトはPOST (追加)

            if (editMode === 'edit' && currentGoal.scoreId) {
                apiUrl = process.env.SERVER_URL + `?func=updateGoal`; // 修正API
                method = 'POST'; // 修正もPOSTを使用
                form.append('scoreId', currentGoal.scoreId); // scoreIdを追加
            } else if (editMode === 'add') {
                apiUrl = process.env.SERVER_URL + `?func=recordGoal`; // 追加API
            }
            if (apiUrl) {
                try {
                    const response = await fetch(apiUrl, {
                        method: method,
                        headers: {
                            'Accept': 'application/json',
                        },
                        body: form,
                    });

                    if (response.ok) {
                        if (editMode === 'add') {
                            // 現在のscoreIdの最大値を取得し、+1して新しいscoreIdを生成
                            const maxScoreId = matchScores.reduce((maxId, score) => {
                                const currentId = parseInt(score.id, 10); // score.idを数値に変換
                                return currentId > maxId ? currentId : maxId;
                            }, 0); // 初期値を0に設定
                            const newScoreId = String(maxScoreId + 1); // 新しいscoreIdを計算し、文字列に変換

                            const newScore = {
                                id: newScoreId, // 新しいscoreIdを使用
                                team: currentGoal.team!,
                                scorer: currentGoal.scorer!,
                                assister: currentGoal.assister,
                            };
                            setMatchScores(prevScores => [...prevScores, newScore]); // matchScoresを直接更新（追加モード）
                         } else if (editMode === 'edit') {
                            setMatchScores(prevScores =>
                                prevScores.map(score =>
                                    score.id === currentGoal.scoreId ? {
                                        ...score,
                                        team: currentGoal.team!,
                                        scorer: currentGoal.scorer!,
                                        assister: currentGoal.assister,
                                    } : score
                                )
                            ); // matchScoresを直接更新（修正モード）
                        }
                        setEditMode('add'); // モードを 'add' に戻す
                    } else {
                        const errorData = await response.json();
                        console.error('ゴール記録エラー:', errorData);
                        alert('ゴール記録に失敗しました。');
                    }
                } catch (error) {
                    console.error('ゴール記録中にエラーが発生しました:', error);
                    alert('ゴール記録中にエラーが発生しました。');
                } finally {
                    setIsSaving(false); // saving終了時にfalseにする
                }
            } else {
                console.error('SERVER_URLが設定されていません。');
                alert('サーバーURLが設定されていません。');
            }
        };
    }

    // ゴール削除処理
    const handleDeleteGoal = async () => {
        setIsSaving(true); // saving開始時にtrueにする
        if (editMode === 'delete' && currentGoal.scoreId && selectedVideo) {
            const videoId = selectedVideo; // selectedVideoがvideoId
            const scoreId = currentGoal.scoreId;

            if (!videoId || !scoreId) {
                alert('試合IDまたはスコアIDが選択されていません。');
                return;
            }

            const form:FormData = new FormData();
            form.append('matchId', videoId);
            form.append('scoreId', scoreId);

            try {
                const url = process.env.SERVER_URL + `?func=deleteGoal`;
                if (url) {
                    const response = await fetch(url, {
                        method: 'POST', // 削除もPOSTを使用
                        headers: {
                            'Accept': 'application/json',
                        },
                        body: form,
                    });

                    if (response.ok) {
                        // alert('ゴールを削除しました！'); // 必要に応じて復活
                        setMatchScores(prevScores => prevScores.filter(score => score.id !== currentGoal.scoreId)); // matchScoresから削除
                        setCurrentGoal({ // 入力フォームをリセット
                            scoreId: null,
                            scorer: null,
                            assister: null,
                            team: null
                        });
                        setEditMode('add'); // モードを 'add' に戻す
                    } else {
                        const errorData = await response.json();
                        console.error('ゴール削除エラー:', errorData);
                        alert('ゴール削除に失敗しました。');
                    }
                } else {
                    console.error('SERVER_URLが設定されていません。');
                    alert('サーバーURLが設定されていません。');
                }
            } catch (error) {
                console.error('ゴール削除中にエラーが発生しました:', error);
                alert('ゴール削除中にエラーが発生しました。');
            } finally {
                setIsSaving(false); // saving開始時にtrueにする
            }
        } else {
            alert('削除モードでスコアIDを選択してください。');
        }
    };


    // スコア記録の行クリック時の処理
    const handleScoreRowClick = (score: { id: string, scorer: string, assister: string | null, team: string }) => {
        if (editMode === 'edit') {
            setCurrentGoal({
                scoreId: score.id,
                scorer: score.scorer,
                assister: score.assister,
                team: score.team
            });
        }
    };

    const handleEndMatch = async () => {
        if (!selectedVideo || !videos) {
            alert('試合が選択されていません。');
            return;
        }
        setIsSaving(true); // saving開始時にtrueにする
        try {
            // サーバーに勝ちチームを問い合わせる
            const videoId = selectedVideo;
            const url = process.env.SERVER_URL + `?func=getWinningTeam&matchId=${videoId}`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                // console.log("Winning Team Data:", data); // レスポンスデータの確認

                if (response.ok) {
                    const winningTeamName = data.winningTeam; // サーバーからのレスポンスで勝ちチーム名を取得
                    console.log(winningTeamName);
                    if (winningTeamName === 'draw' && selectedMatchType !== '5') {
                        // 同点かつ、トーナメントの場合
                        setIsEndMatchDialogOpen(true);
                    } else {
                        // 勝ちチームが確定した場合、サーバーに送信
                        await sendWinningTeamToServer(videoId, winningTeamName);
                    }
                } else {
                    const errorData = await response.json();
                    console.error('勝ちチーム取得エラー:', errorData);
                    alert('勝ちチームの取得に失敗しました。');
                }
            } else {
                console.error('SERVER_URLが設定されていません。');
                alert('サーバーURLが設定されていません。');
            }
        } catch (error) {
            console.error('試合終了処理中にエラーが発生しました:', error);
            alert('試合終了処理中にエラーが発生しました。');
        } finally {
            setIsSaving(false); // saving終了時にfalseにする
        }
    };

    // 勝利チームをサーバーに送信する関数
    const sendWinningTeamToServer = async (videoId: string, winningTeamName: string) => {
        try {
            setIsSaving(true);
            const form = new FormData();
            form.append('matchId', videoId);
            form.append('winningTeam', winningTeamName);

            const url = process.env.SERVER_URL + `?func=closeGame`;
            if (url) {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                    },
                    body: form,
                });

                if (response.ok) {
                    alert(`${winningTeamName}の勝利を記録しました！`);
                    // 試合結果を更新するためにfetchVideosを再度実行するか、必要に応じてstateを更新
                    fetchScores(true); // スコアと試合結果を再fetch
                } else {
                    const errorData = await response.json();
                    console.error('勝利チーム記録エラー:', errorData);
                    alert('勝利チームの記録に失敗しました。');
                }
            } else {
                console.error('SERVER_URLが設定されていません。');
                alert('サーバーURLが設定されていません。');
            }
        } catch (error) {
            console.error('勝利チーム記録中にエラーが発生しました:', error);
            alert('勝利チーム記録中にエラーが発生しました。');
        } finally {
            setIsSaving(false); 
        }
    };

    // ダイアログで勝利チームが選択された時の処理
    const handleDialogWinningTeamSelect = async (teamName: string) => {
        setDialogWinningTeam(teamName);
    };

    // ダイアログの「OK」ボタンクリック時の処理
    const handleDialogOk = async () => {
        setIsEndMatchDialogOpen(false); // ダイアログを閉じる
        if (dialogWinningTeam && selectedVideo) {
            await sendWinningTeamToServer(selectedVideo, dialogWinningTeam);
            setDialogWinningTeam(null); // 選択状態をリセット
        }
    };

    // ダイアログの「キャンセル」ボタンクリック時の処理
    const handleDialogCancel = () => {
        setIsEndMatchDialogOpen(false); // ダイアログを閉じる
        setDialogWinningTeam(null); // 選択状態をリセット
    };
    // 試合作成処理
    const handleCreateMatch = async () => {
        setIsCreatingMatch(true);
        try {
            const url = process.env.SERVER_URL + `?func=createShootLog`;
            const form = new FormData();
            form.append('teamCount', selectedMatchType as string);
            if (url) {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                    },
                    body: form, // 選択された試合タイプを送信
                });
                if (response.ok) {
                    // alert('試合作成に成功しました！');
                    fetchScores(true); // 試合リストを再取得して更新
                } else {
                    const errorData = await response.json();
                    console.error('試合作成エラー:', errorData);
                    // alert('試合作成に失敗しました。');
                }
            } else {
                console.error('SERVER_URLが設定されていません。');
                alert('サーバーURLが設定されていません。');
            }
        } catch (error) {
            console.error('試合作成中にエラーが発生しました:', error);
            alert('試合作成中にエラーが発生しました。');
        } finally {
            setIsCreatingMatch(false);
        }
    };


    return (
        <>
            {videos && teams && users ? (
                <>
                    {/* 画面上部のコンボボックスとボタン */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={8} sm={6} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="match-type-select-label">試合タイプ選択</InputLabel>
                                <Select
                                    labelId="match-type-select-label"
                                    id="match-type-select"
                                    value={selectedMatchType}
                                    label="試合タイプ選択"
                                    disabled={(!!scores && scores.length > 1) || (videos && videos.some(video => video[9]))}
                                    onChange={(e) => setSelectedMatchType(e.target.value)}
                                >
                                    <MenuItem value="3">３チーム（１面）</MenuItem>
                                    <MenuItem value="4">４チーム（１面）</MenuItem>
                                    <MenuItem value="5">５チーム（２面）</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4} sm={6} md={4}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreateMatch}
                                disabled={isCreatingMatch || (!!scores && scores.length > 1) || (videos && videos.some(video => video[9]))}
                            >
                                試合作成
                                {isCreatingMatch && <CircularProgress size={24} sx={{ color: 'white', position: 'absolute', top: '50%', left: '16px', marginTop: '-12px' }} />}
                            </Button>
                        </Grid>
                    </Grid>

                    <FormControl fullWidth margin="normal" >
                        <InputLabel id="video-select-label" > 試合選択 </InputLabel>
                        <Select labelId="video-select-label"
                            id="video-select"
                            value={
                                selectedVideo || ''
                            }
                            label="試合選択"
                            onChange={
                                handleVideoSelect
                            } > {
                                videos.map((video, index) => (<MenuItem key={index} value={video[10]} >
                                                                {video[1]}
                                                            </MenuItem>))
                            }
                        </Select>
                    </FormControl>
                    {selectedVideo && (
                        <>
                            <Grid container spacing={2} >
                                <TeamSection teamNumber={1}
                                    teamName={videos.find(video => video[10] === selectedVideo)?.[3] || ''}
                                    players={team1Players}
                                />
                                <Grid container justifyContent="center">
                                    {selectedVideo && videos.find(video => video[10] === selectedVideo) ? (
                                        <Typography variant="h5" component="div" sx={{ textAlign: 'center', my: 2 }}>
                                            {videos.find(video => video[10] === selectedVideo)![7] || '0'} - {videos.find(video => video[10] === selectedVideo)![8] || '0'}
                                            {videos.find(video => video[10] === selectedVideo)![9] ? ` (${videos.find(video => video[10] === selectedVideo)![9]})` : '(未集計)'}
                                        </Typography>
                                    ) : null}
                                </Grid>
                                <TeamSection teamNumber={2}
                                    teamName={videos.find(video => video[10] === selectedVideo)?.[4] || ''}
                                    players={team2Players}
                                />
                            </Grid>

                            <Grid container alignItems="center" sx={{ mt: 2, mb: 1 }}>
                                <Grid item xs>
                                    <Typography variant="h6" component="div">得点入力</Typography>
                                </Grid>
                                <Grid item>
                                    <Button variant="contained" sx={{ mr: 1, ...(editMode === 'add' && { backgroundColor: 'lightblue' }) }} onClick={() => setEditMode('add')} >追加</Button>
                                    <Button variant="contained" sx={{ mr: 1, ...(editMode === 'edit' && { backgroundColor: 'lightblue' }) }} onClick={() => setEditMode('edit')} >修正</Button>
                                    <Button variant="contained" onClick={() => setEditMode('delete')}  sx={{ ...(editMode === 'delete' && { backgroundColor: 'lightblue' }) }}>削除</Button>
                                </Grid>
                            </Grid>


                            {editMode !== 'delete' && ( // 削除モード以外の場合の入力フォーム
                                <>
                                    {editMode === 'edit' && ( // 修正モードの場合のみ表示
                                        <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                            <TextField
                                                fullWidth
                                                id="score-id"
                                                label="スコアID"
                                                value={currentGoal.scoreId || ''}
                                                disabled // 修正モードではIDは変更不可とするか、必要に応じて変更可能にする
                                            />
                                        </FormControl>
                                    )}
                                    <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                        <InputLabel id="team-select-label">チーム</InputLabel>
                                        <Select fullWidth labelId="team-select-label"
                                            id="team-select"
                                            value={currentGoal.team || ''}
                                            label="チーム"
                                            onChange={(e) => setCurrentGoal({ ...currentGoal, team: e.target.value })}
                                            disabled={editMode === 'edit'} // 修正モードではチーム選択を不可にする
                                        >
                                            <MenuItem value={videos.find(video => video[10] === selectedVideo)?.[3] || ''}>
                                                {videos.find(video => video[10] === selectedVideo)?.[3] || ''}
                                            </MenuItem>
                                            <MenuItem value={videos.find(video => video[10] === selectedVideo)?.[4] || ''}>
                                                {videos.find(video => video[10] === selectedVideo)?.[4] || ''}
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                        <InputLabel id="scorer-select-label">得点者</InputLabel>
                                        <Select fullWidth labelId="scorer-select-label" id="scorer-select" value={currentGoal.scorer || ''} label="得点者"
                                            onChange={(e) => setCurrentGoal({ ...currentGoal, scorer: e.target.value })} >
                                            {currentGoal.team === videos.find(video => video[10] === selectedVideo)?.[3] ? (
                                                team1Players
                                                    .filter(player => player !== currentGoal.assister) // アシストに選択された選手を除外
                                                    .map(
                                                        (player) => (<MenuItem key={player} value={player} > {player} </MenuItem>)
                                                    ))
                                                : currentGoal.team === videos.find(video => video[10] === selectedVideo)?.[4] ? (
                                                    team2Players
                                                        .filter(player => player !== currentGoal.assister) // アシストに選択された選手を除外
                                                        .map(
                                                            (player) => (<MenuItem key={player} value={player} > {player} </MenuItem>)
                                                        ))
                                                : null
                                            }
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                        <InputLabel id="assister-select-label">アシスト</InputLabel>
                                        <Select fullWidth labelId="assister-select-label"
                                            id="assister-select"
                                            value={currentGoal.assister || ''}
                                            label="アシスト (任意)"
                                            onChange={(e) => setCurrentGoal({ ...currentGoal, assister: e.target.value })} >
                                            <MenuItem value=''>なし</MenuItem>
                                            {currentGoal.team === videos.find(video => video[10] === selectedVideo)?.[3] ? (
                                                team1Players
                                                    .filter(player => player !== currentGoal.scorer) // 得点者に選択された選手を除外
                                                    .map((player) => (<MenuItem key={player} value={player} >
                                                        {player}
                                                    </MenuItem>))
                                            ) : currentGoal.team === videos.find(video => video[10] === selectedVideo)?.[4] ? (
                                                team2Players
                                                    .filter(player => player !== currentGoal.scorer) // 得点者に選択された選手を除外
                                                    .map((player) => (<MenuItem key={player} value={player} >
                                                        {player}
                                                    </MenuItem>))
                                            ) : null
                                            }
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleAddGoal}
                                            sx={{ mt: 2, position: 'relative' }} // ボタン内にローディングアイコンを重ねるためにposition: 'relative' を追加
                                            disabled={isSaving} // チームと得点者が選択されていない場合、ボタンをdisabledにする
                                        >
                                            {editMode === 'edit' ? '更新' : 'ゴール追加'}
                                            {isSaving && <CircularProgress size={24} sx={{ color: 'white', position: 'absolute', top: '50%', left: '16px', marginTop: '-12px' }} />}
                                            {isSaving && <span style={{ marginLeft: '30px' }}>Saving...</span>}
                                        </Button>
                                    </FormControl>
                                </>
                            )}

                            {editMode === 'delete' && ( // 削除モードの場合の入力フォーム
                                <>
                                    <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                        <TextField
                                            fullWidth
                                            id="score-id-delete"
                                            label="スコアID"
                                            value={currentGoal.scoreId || ''}
                                            onChange={(e) => setCurrentGoal({ ...currentGoal, scoreId: e.target.value })}
                                        />
                                    </FormControl>
                                    <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleDeleteGoal}
                                            sx={{ mt: 2 }}
                                            disabled={isSaving} // スコアIDが選択されていない場合、ボタンをdisabledにする
                                        >
                                            削除
                                            {isSaving && <CircularProgress size={24} sx={{ color: 'white', position: 'absolute', top: '50%', left: '16px', marginTop: '-12px' }} />}
                                            {isSaving && <span style={{ marginLeft: '30px' }}>Deleting...</span>}
                                        </Button>
                                    </FormControl>
                                </>
                            )}

                            { /* スコア記録表示 */ }
                            <Typography variant="h6" component="div" sx={{ mt: 3 }}>ゴールの記録</Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell> {/* ID列を追加 */}
                                        <TableCell>チーム</TableCell>
                                        <TableCell>得点者</TableCell>
                                        <TableCell>アシスト</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {matchScores.map((score, index) => (
                                        <TableRow key={index} onClick={() => handleScoreRowClick(score)} style={{ cursor: 'pointer' }}> {/* 行クリックで編集モードにする場合はここを修正 */}
                                            <TableCell>{score.id}</TableCell> {/* IDを表示 */}
                                            <TableCell>{score.team}</TableCell>
                                            <TableCell>{score.scorer}</TableCell>
                                            <TableCell>{score.assister || '-'}</TableCell> { /* アシストがない場合は '-' を表示 */ }
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <FormControl fullWidth margin="normal" sx={{ display: 'block' }}>
                                <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleEndMatch} disabled={isSaving} >
                                    試合終了（点数を集計）
                                    {isSaving && <CircularProgress size={24} sx={{ color: 'white', position: 'absolute', top: '50%', left: '16px', marginTop: '-12px' }} />}
                                    {isSaving && <span style={{ marginLeft: '30px' }}>Saving...</span>}
                                </Button>
                            </FormControl>

                            {/* 同点の場合の勝利チーム選択ダイアログ */}
                            <Dialog open={isEndMatchDialogOpen} onClose={handleDialogCancel}>
                                <DialogTitle>勝利チームを選択してください</DialogTitle>
                                <DialogContent>
                                    <Button onClick={() => handleDialogWinningTeamSelect(videos.find(video => video[10] === selectedVideo)?.[3] || '')}
                                            variant={dialogWinningTeam === videos.find(video => video[10] === selectedVideo)?.[3] ? 'contained' : 'outlined'}
                                    >
                                        {videos.find(video => video[10] === selectedVideo)?.[3]}
                                    </Button>
                                    <Button onClick={() => handleDialogWinningTeamSelect(videos.find(video => video[10] === selectedVideo)?.[4] || '')}
                                            variant={dialogWinningTeam === videos.find(video => video[10] === selectedVideo)?.[4] ? 'contained' : 'outlined'}
                                            sx={{ ml: 2 }}
                                    >
                                        {videos.find(video => video[10] === selectedVideo)?.[4]}
                                    </Button>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleDialogCancel} color="primary">
                                        キャンセル
                                    </Button>
                                    <Button onClick={handleDialogOk} color="primary" disabled={!dialogWinningTeam}>
                                        OK
                                    </Button>
                                </DialogActions>
                            </Dialog>

                        </>
                    )}
                </>
            ) : (
                <div style={
                    {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh'
                    }
                } >
                    <div> Preparing Score Input Console... </div> <CircularProgress />
                </div>
            )} 
        </>
    );
}
