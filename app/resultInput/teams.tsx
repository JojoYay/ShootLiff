'use client';
import { useEffect, useState } from 'react';
import { Avatar, Button, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography } from '@mui/material';

export default function Teams() {
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
    const [initialTeamData, setInitialTeamData] = useState<string[][]>([]);  // 追加: 初期データを保存

    const [unassignedUsers, setUnassignedUsers] = useState<string[]>([]); // 未所属ユーザーの状態を追加
    const [selectedUser, setSelectedUser] = useState<string | null>(null); // 選択中のユーザーの状態を追加

	const [users, setUsers] = useState<string[][] | null>(null);

	// const [profile, setProfile] = useState<Profile | null>(null);
	// const [loading, setLoading] = useState(false);
	// const [result, setResult] = useState('');
	// const { liff } = useLiff();

	// if (liff) {
	// 	liff.ready.then(() => {
	// 		if (!liff.isLoggedIn()) {
	// 			liff.login({ redirectUri: window.location.href });
	// 		}
	// 	})
	// }

	// useEffect(() => {
	// 	console.log("Liff login (register page)");
	// 	if (liff?.isLoggedIn()) {
	// 		(async () => {
	// 			const prof = await liff.getProfile();
	// 			setProfile(prof);
	// 		})();
	// 	}
	// }, [liff]);

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
                setInitialTeamData(teamData); // 初期データを保存
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


	// // 選択済みのプレイヤーを除外したオプションを取得
	// const getAvailablePlayers = (currentTeam: string[]) => {
	// 	const selectedPlayers = [
	// 		...team1, ...team2, ...team3, ...team4, ...team5,
	// 		...team6, ...team7, ...team8, ...team9, ...team10
	// 	];
	// 	return teams.filter(player => 
	// 		!selectedPlayers.includes(player) || currentTeam.includes(player)
	// 	);
	// };
	
	// const defaultProps = {
	// 	options: teams,
	// 	getOptionLabel: (teams: string) => teams,
	// };

    // チーム変更をサーバーに一括送信する関数
    const updateTeamsOnServer = async (changes: { player: string; teamNumber: number }[]) => {
        try {
            const url = process.env.SERVER_URL;
			if(!url){
				throw Error("SERVER_URLが指定されていません");
			}
			console.log(JSON.stringify(changes));
			const formData = new FormData();
			changes.forEach((change, index) => {
				formData.append(change.player, String(change.teamNumber));
			});			
			formData.append('func', 'updateTeams');
			// formData.append('userId', 'dummy');
			// formData.append('teams', encodedStr);
			// formData.append('teams', encodeURIComponent(JSON.stringify(changes)));
            const response = await fetch(url, {
                method: 'POST',
				body: formData,
				// body: JSON.stringify({'func':'upload', 'teams':encodeURIComponent(JSON.stringify(changes))}),
				headers: {
					// 'Content-Type': 'text/plain;charset=UTF-8',
					'Accept': 'application/json',
				},
            });
            const data = await response.json();
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
            // if (!data.success) {
            //     throw new Error(data.message || 'Failed to update teams');
            // }
            return data;
        } catch (error) {
            console.error('Error updating teams:', error);
            throw error;
        }
    };

    // すべての変更を保存
    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // 初期のチーム割り当てを保存
            const initialAssignments = new Map(
                teams.map(player => {
                    const teamData = initialTeamData.find(t => t[0] === player);
                    const teamNumber = teamData ? parseInt(teamData[1].replace('チーム', '')) || 0 : 0;
                    return [player, teamNumber];
                })
            );

            // 現在のチーム割り当てを取得
            const currentAssignments = getCurrentTeamAssignments();

            // 変更のあったプレイヤーを特定
            const changedPlayers: { player: string; teamNumber: number }[] = [];
            currentAssignments.forEach((teamNumber, player) => {
                const initialTeam = initialAssignments.get(player) || 0;
                if (teamNumber !== initialTeam) {
                    changedPlayers.push({ player, teamNumber });
                }
            });

            if (changedPlayers.length > 0) {
                // 変更のあったプレイヤーのデータを一括で送信
                await updateTeamsOnServer(changedPlayers);
                console.log(`Updated ${changedPlayers.length} players`);
            }

            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save teams:', error);
            await fetchTeams(); // エラー時はデータを再取得
        } finally {
            setIsSaving(false);
        }
    };
    // 現在のチーム割り当てを取得
    const getCurrentTeamAssignments = () => {
        const assignments = new Map();
        teams.forEach(player => {
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

    const handleTeamAssign = (teamNumber: number) => {
        if (!selectedUser) {
            return;
        }

        let updatedTeam;
        let updatedUnassigned;
        const userToAssign = selectedUser;
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

    const UserCard = ({ userName, isUnassigned, imageUrl }: { userName: string, isUnassigned?: boolean, imageUrl?: string | null }) => (
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
    );

    const TeamSection = ({ teamNumber, teamName, players }: { teamNumber: number, teamName: string, players: string[] }) => (
        <Grid item xs={12} sm={6} md={4} key={teamNumber}>
            <Typography variant="h6" component="div" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
                {teamName}
            </Typography>

            <Card
                sx={{ minHeight: 150, padding: '1px', textAlign: 'center', backgroundColor: '#f0f0f0',...(teamNumber === 0 && { // teamNumber が 0 の場合のみスタイルを適用
																																maxHeight: '200px',
																																overflowY: 'auto',
																															}),
				 }}
                onClick={() => handleTeamAssign(teamNumber)}
            >
                 <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {players.map(player => {
                        const userData = users?.find(user => user[1] === player); // ユーザー名でusersデータから検索
                        const imageUrl = userData?.[4] || null; // 5列目のURLを取得、存在しない場合はnull
						// console.log("user:"+userData);
                        return (
                            <UserCard key={player} userName={player} imageUrl={imageUrl} /> // imageUrlをpropsとして渡す
                        );
                    })}
                </div>
            </Card>
        </Grid>
    );


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
                            />
                        ))}
                    </Grid>
                </>
           ) : (
                // ... existing loading state ...
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Preparing Team Input Console... </div>
                    <CircularProgress />
                </div>
            )}
        </>
    );
}