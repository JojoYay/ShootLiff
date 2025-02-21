'use client';
import { useEffect, useState, SetStateAction } from 'react';
import { Avatar, Button, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

export default function TeamInput() {
    const [teams, setTeams] = useState<string[]>([]);
    // const [value, setValue] = useState<string>('');
    const [team1, setTeam1] = useState<string[]>([]);
    const [team2, setTeam2] = useState<string[]>([]);
    const [team3, setTeam3] = useState<string[]>([]);
    const [team4, setTeam4] = useState<string[]>([]);
    const [team5, setTeam5] = useState<string[]>([]);
    const [team6, setTeam6] = useState<string[]>([]);
    const [team7, setTeam7] = useState<string[]>([]);
    const [team8, setTeam8] = useState<string[]>([]);
    const [team9, setTeam9] = useState<string[]>([]);
    const [team10, setTeam10] = useState<string[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [unassignedUsers, setUnassignedUsers] = useState<string[]>([]); // 未所属ユーザーの状態を追加
    const [selectedUser, setSelectedUser] = useState<string | null>(null); // 選択中のユーザーの状態を追加

    const [users, setUsers] = useState<string[][] | null>(null);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const url = process.env.SERVER_URL + `?func=getTeams&func=getUsers`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                const teamData:string[][] = data.teams as string[][];
                setUsers(data.users);
                // console.log(data.users);
                // プレイヤー名のリストを作成
                const playerNames = teamData.slice(1).map(player => player[0]);
                setTeams(playerNames);

                // チーム別に初期値を設定
                const team1Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム1')
                    .map(player => player[0]);
                const team2Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム2')
                    .map(player => player[0]);
                const team3Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム3')
                    .map(player => player[0]);
                const team4Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム4')
                    .map(player => player[0]);
                const team5Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム5')
                    .map(player => player[0]);
                const team6Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム6')
                    .map(player => player[0]);
                const team7Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム7')
                    .map(player => player[0]);
                const team8Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム8')
                    .map(player => player[0]);
                const team9Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム9')
                    .map(player => player[0]);
                const team10Players = teamData.slice(1)
                    .filter(player => player[1] === 'チーム10')
                    .map(player => player[0]);
                const unassignedPlayers = teamData.slice(1)
                    .filter(player => !player[1])
                    .map(player => player[0]);

                setTeam1(team1Players);
                setTeam2(team2Players);
                setTeam3(team3Players);
                setTeam4(team4Players);
                setTeam5(team5Players);
                setTeam6(team6Players);
                setTeam7(team7Players);
                setTeam8(team8Players);
                setTeam9(team9Players);
                setTeam10(team10Players);
                setUnassignedUsers(unassignedPlayers);
            }

        } catch (error) {
            console.error('Error fetching Teams:', error);
        }
    };

    const handleUserSelect = (userName: string) => {
        setSelectedUser(userName === selectedUser ? null : userName); // 選択状態の切り替え
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        setHasChanges(false); // 保存開始時に変更フラグをリセット

        const currentAssignments:Map<string, number> = getCurrentAssignments();
        console.log(currentAssignments);

        try {
            const formData = new FormData();            
			currentAssignments.forEach((value, key) => {
                if(key){
                    console.log(key + '==' + String(value) +" " + value);
                    formData.append(key, String(value));
                }
			});
            
            console.log(JSON.stringify(formData));
			formData.append('func', 'updateTeams');
            if(!process.env.SERVER_URL){
                return;
            }
            const response = await fetch(process.env.SERVER_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            //setHasChanges(false); // 保存後に変更なし状態にする
            console.log('Team data saved successfully');
            // 必要に応じて成功時の処理を追加
        } catch (error) {
            console.error('Error saving team data:', error);
            // 必要に応じてエラー処理を追加
        } finally {
            setIsSaving(false);
        }
    };


    const getCurrentAssignments = () => {
        const assignments: Map<string, number> = new Map();
        users?.slice(1).forEach(playerData => {
            const player = playerData[1];
            if (team1.includes(player)) assignments.set(player, 1);
            else if (team2.includes(player)) assignments.set(player, 2);
            else if (team3.includes(player)) assignments.set(player, 3);
            else if (team4.includes(player)) assignments.set(player, 4);
            else if (team5.includes(player)) assignments.set(player, 5);
            else if (team6.includes(player)) assignments.set(player, 6);
            else if (team7.includes(player)) assignments.set(player, 7);
            else if (team8.includes(player)) assignments.set(player, 8);
            else if (team9.includes(player)) assignments.set(player, 9);
            else if (team10.includes(player)) assignments.set(player, 10);
            else assignments.set(player, 0); // 未所属
        });
        return assignments;
    };

    const handleTeamAssign = (teamNumber: number, user: string | null = null) => {
        // console.log('handleTeamAssign is called', teamNumber, 'selectedUser:', selectedUser, 'user',user); // ログ追加
        let userToAssign = selectedUser;
        if(user){
            userToAssign = user;
        }
        // console.log("selectedUser:"+selectedUser);
        if(!userToAssign){
            return;
        }

        let updatedTeam;
        let updatedUnassigned;
        // userToAssign = selectedUser;
        setSelectedUser(null); // 選択解除

        // ユーザーが現在所属しているチームを特定し、そこから削除 (同じチーム選択時も削除処理は行う)
        if (team1.includes(userToAssign)) {
            if (teamNumber === 1) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam1(team1.filter(user => user !== userToAssign));
        } else if (team2.includes(userToAssign)) {
            if (teamNumber === 2) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam2(team2.filter(user => user !== userToAssign));
        } else if (team3.includes(userToAssign)) {
            if (teamNumber === 3) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam3(team3.filter(user => user !== userToAssign));
        } else if (team4.includes(userToAssign)) {
            if (teamNumber === 4) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam4(team4.filter(user => user !== userToAssign));
        } else if (team5.includes(userToAssign)) {
            if (teamNumber === 5) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam5(team5.filter(user => user !== userToAssign));
        } else if (team6.includes(userToAssign)) {
            if (teamNumber === 6) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam6(team6.filter(user => user !== userToAssign));
        } else if (team7.includes(userToAssign)) {
            if (teamNumber === 7) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam7(team7.filter(user => user !== userToAssign));
        } else if (team8.includes(userToAssign)) {
            if (teamNumber === 8) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam8(team8.filter(user => user !== userToAssign));
        } else if (team9.includes(userToAssign)) {
            if (teamNumber === 9) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam9(team9.filter(user => user !== userToAssign));
        } else if (team10.includes(userToAssign)) {
            if (teamNumber === 10) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setTeam10(team10.filter(user => user !== userToAssign));
        } else if (unassignedUsers.includes(userToAssign)) {
            if (teamNumber === 0) { // 同じチームを選択した場合、チームから削除して未所属にする
                return; // 処理を中断
            }
            setUnassignedUsers(unassignedUsers.filter(user => user !== userToAssign));
        }
        switch (teamNumber) {
            case 0: // 未所属グループに移動
                if (!unassignedUsers.includes(userToAssign)) { // ユーザーが未所属リストに存在しない場合のみ追加
                    updatedUnassigned = [...unassignedUsers, userToAssign];
                    setUnassignedUsers(updatedUnassigned);
                }
                break;
            case 1:
                updatedTeam = [...team1, userToAssign];
                setTeam1(updatedTeam);
                break;
            case 2:
                updatedTeam = [...team2, userToAssign];
                setTeam2(updatedTeam);
                break;
            case 3:
                updatedTeam = [...team3, userToAssign];
                setTeam3(updatedTeam);
                break;
            case 4:
                updatedTeam = [...team4, userToAssign];
                setTeam4(updatedTeam);
                break;
            case 5:
                updatedTeam = [...team5, userToAssign];
                setTeam5(updatedTeam);
                break;
            case 6:
                updatedTeam = [...team6, userToAssign];
                setTeam6(updatedTeam);
                break;
            case 7:
                updatedTeam = [...team7, userToAssign];
                setTeam7(updatedTeam);
                break;
            case 8:
                updatedTeam = [...team8, userToAssign];
                setTeam8(updatedTeam);
                break;
            case 9:
                updatedTeam = [...team9, userToAssign];
                setTeam9(updatedTeam);
                break;
            case 10:
                updatedTeam = [...team10, userToAssign];
                setTeam10(updatedTeam);
                break;
            default:
                break;
        }
        setHasChanges(true);
    };

    const UserCard = ({ userName, isUnassigned, imageUrl }: { userName: string, isUnassigned?: boolean, imageUrl?: string | null }) => {
        return (
        <Card
            sx={{
                minWidth: 100,
                margin: 1,
                backgroundColor: selectedUser === userName ? 'lightblue' : 'white',
                minHeight: isUnassigned ? '50px' : 'auto', // 未所属の場合のみ高さを固定
                maxHeight: isUnassigned ? '50px' : 'auto', // 未所属の場合のみ高さを固定
                overflowY: isUnassigned ? 'scroll' : 'hidden', // 未所属の場合のみスクロールバーを表示
            }}
        >
            <CardActionArea onClick={() => handleUserSelect(userName)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
                    <Avatar
                        alt={userName}
                        src={imageUrl || undefined} // imageUrlがなければAvatarを表示しない
                        sx={{ width: 24, height: 24, marginRight: 1 }}
                    />
                    <Typography variant="h6" component="div">
                        {userName}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )};

    const TeamSection = ({ teamNumber, teamName, players, unassignedUsers, handleTeamAssign}: {
        teamNumber: number,
        teamName: string,
        players: string[],
        unassignedUsers: string[],
        handleTeamAssign: (teamNumber: number, user:string|null) => void,
        // setSelectedUser: (user:string) => void
    }) => {
        const [selectedUnassignedUser, setSelectedUnassignedUser] = useState<string | null>(null);

        const handleChange = (event: { target: { value: SetStateAction<string | null>; }; }) => {
            const selectedUser1 = event.target.value;
            if (selectedUser1) {
                // console.log("1"+selectedUser1+'2:'+selectedUnassignedUser);
                // setSelectedUser(selectedUser.toString());
                handleTeamAssign(teamNumber, selectedUser1.toString()); // ユーザーをチームに割り当てる
                setUnassignedUsers(unassignedUsers.filter(user => user !== selectedUser1)); // 未所属リストから削除
                setSelectedUnassignedUser(''); // ComboBox の選択をリセット
            // } else {
            //     setSelectedUnassignedUser(event.target.value); // 未選択状態を保持
            }
        };

        return (
            <Grid item xs={12} sm={6} md={4} key={teamNumber}>
                <Typography variant="h6" component="div" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
                    {teamName}
                </Typography>

                {teamNumber !== 0 && ( // teamNumber が 0 でない場合のみ ComboBox を表示
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="unassigned-user-select-label">未所属ユーザー</InputLabel>
                        <Select
                            labelId="unassigned-user-select-label"
                            id="unassigned-user-select"
                            value={selectedUnassignedUser || ''}
                            label="未所属ユーザー"
                            onChange={handleChange}
                        >
                            <MenuItem value="">
                                <em>なし</em>
                            </MenuItem>
                            {unassignedUsers.map((user) => (
                                <MenuItem key={user} value={user}>{user}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <Card
                    sx={{ minHeight: 150, padding: '1px', textAlign: 'center', backgroundColor: '#f0f0f0',...(teamNumber === 0 && {
                                                                                    maxHeight: '200px',
                                                                                    overflowY: 'auto',
                                                                                }),
                     }}
                    onClick={() => handleTeamAssign(teamNumber,null)}
                >
                     <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {players.map(player => {
                            const userData = users?.find(user => user[1] === player);
                            const imageUrl = userData?.[4] || null;
                            return (
                                <UserCard key={player} userName={player} imageUrl={imageUrl} isUnassigned={teamNumber === 0}/>
                            );
                        })}
                    </div>
                </Card>
            </Grid>
        );
    };


    return (
        <>
            {teams.length > 0 ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 1 }}>
                        <div>Team Setting</div>
                        <div>
                            <Button
                                variant="contained"
                                onClick={handleSaveAll}
                                disabled={isSaving || !hasChanges}
                            >
                                {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>

                    <Grid container spacing={2} sx={{ p: 2, mt: 0 }}>
                        {[
                            { state: unassignedUsers, setState: setUnassignedUsers, label: '未所属ユーザー', number: 0 },
                            { state: team1, setState: setTeam1, label: 'Team 1', number: 1 },
                            { state: team2, setState: setTeam2, label: 'Team 2', number: 2 },
                            { state: team3, setState: setTeam3, label: 'Team 3', number: 3 },
                            { state: team4, setState: setTeam4, label: 'Team 4', number: 4 },
                            { state: team5, setState: setTeam5, label: 'Team 5', number: 5 },
                            { state: team6, setState: setTeam6, label: 'Team 6', number: 6 },
                            { state: team7, setState: setTeam7, label: 'Team 7', number: 7 },
                            { state: team8, setState: setTeam8, label: 'Team 8', number: 8 },
                            { state: team9, setState: setTeam9, label: 'Team 9', number: 9 },
                            { state: team10, setState: setTeam10, label: 'Team 10', number: 10 },
                        ].map((team, index) => (
                            <TeamSection
                                key={index}
                                teamNumber={team.number}
                                teamName={team.label}
                                players={team.state}
                                unassignedUsers={unassignedUsers}
                                handleTeamAssign={handleTeamAssign}
                            />
                        ))}
                    </Grid>
                </>
           ) : (
                // Loading状態の表示 ...
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Preparing Team Input Console... </div>
                    <CircularProgress />
                </div>
            )}
        </>
    );
}