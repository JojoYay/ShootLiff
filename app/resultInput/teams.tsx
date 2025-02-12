'use client';
import { useLiff } from '@/app/liffProvider';
import { useEffect, useState } from 'react';
import { Autocomplete, Button, CircularProgress, Grid, TextField } from '@mui/material';
import Link from 'next/link';

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


	// const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState('');
	const { liff } = useLiff();

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
			const url = process.env.SERVER_URL + `?func=getTeams`;
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log(data);
				const teamData:string[][] = data.teams as string[][];
                setInitialTeamData(teamData); // 初期データを保存

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

			}
		} catch (error) {
			console.error('Error fetching Teams:', error);
		}
	};

	const loadTeams = {
	}

	// 選択済みのプレイヤーを除外したオプションを取得
	const getAvailablePlayers = (currentTeam: string[]) => {
		const selectedPlayers = [
			...team1, ...team2, ...team3, ...team4, ...team5,
			...team6, ...team7, ...team8, ...team9, ...team10
		];
		return teams.filter(player => 
			!selectedPlayers.includes(player) || currentTeam.includes(player)
		);
	};
	

	const defaultProps = {
		options: teams,
		getOptionLabel: (teams: string) => teams,
	};

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
    // // チーム変更をサーバーに送信する関数
    // const updateTeamOnServer = async (playerName: string, teamNumber: number) => {
    //     try {
    //         const url = process.env.NEXT_PUBLIC_SERVER_URL + `?func=updateTeam&player=${encodeURIComponent(playerName)}&team=チーム${teamNumber}`;
    //         const response = await fetch(url, {
    //             method: 'GET',
    //         });
    //         const data = await response.json();
    //         if (!data.success) {
    //             throw new Error(data.message || 'Failed to update team');
    //         }
    //     } catch (error) {
    //         console.error('Error updating team:', error);
    //         throw error;
    //     }
    // };

    // // チーム変更を処理する関数
    // const handleTeamChange = async (newValue: string[], teamNumber: number, setState: (value: string[]) => void) => {
    //     setIsSaving(true);
    //     try {
    //         // 変更前と後の値を比較して、追加・削除されたプレイヤーを特定
    //         const currentTeam = teamNumber === 1 ? team1 :
    //                           teamNumber === 2 ? team2 :
    //                           teamNumber === 3 ? team3 : 
	// 						  teamNumber === 4 ? team4 : 
    //                           teamNumber === 5 ? team5 : 
    //                           teamNumber === 6 ? team6 : 
    //                           teamNumber === 7 ? team7 : 
    //                           teamNumber === 8 ? team8 : 
    //                           teamNumber === 9 ? team9 : 
    //                           team10;

    //         // 追加されたプレイヤー
    //         const addedPlayers = newValue.filter(player => !currentTeam.includes(player));
    //         // 削除されたプレイヤー
    //         const removedPlayers = currentTeam.filter(player => !newValue.includes(player));

    //         // 追加されたプレイヤーの処理
    //         for (const player of addedPlayers) {
    //             await updateTeamOnServer(player, teamNumber);
    //         }

    //         // 削除されたプレイヤーの処理（チーム未所属として更新）
    //         for (const player of removedPlayers) {
    //             await updateTeamOnServer(player, 0); // 0 はチーム未所属を表す
    //         }

    //         // 状態を更新
    //         setState(newValue);
    //     } catch (error) {
    //         console.error('Failed to update teams:', error);
    //         // エラーの場合は元の状態に戻す
    //         await fetchTeams(); // チームデータを再取得
    //     } finally {
    //         setIsSaving(false);
    //     }
    // };


	return (
		<>
			{teams.length > 0 ? (
				<>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px' }}>
                        <div>Team Setting</div>
                        <div> {/* ボタンを右側に配置するためのコンテナ */}
                            {/* <Link
                                href="https://docs.google.com/spreadsheets/d/1vOi6GOCvFcA27fik31_TPI24eEgjZrjfCDfvLVLQ4PQ/edit?usp=drive_link"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginRight: '2px' }} // 必要に応じて右マージンを追加
                            >
                                <Button variant="contained">
                                    Doc
                                </Button>
                            </Link> */}
                            <Button
                                variant="contained"
                                onClick={handleSaveAll}
                                disabled={isSaving || !hasChanges}
                            >
                                {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
					<Grid container spacing={2} sx={{ p: 2 }}>
						{[
							{ state: team1, setState: setTeam1, label: 'Team 1', number :1 },
							{ state: team2, setState: setTeam2, label: 'Team 2', number :2 },
							{ state: team3, setState: setTeam3, label: 'Team 3', number :3 },
							{ state: team4, setState: setTeam4, label: 'Team 4', number :4 },
							{ state: team5, setState: setTeam5, label: 'Team 5', number :5 },
							{ state: team6, setState: setTeam6, label: 'Team 6', number :6 },
							{ state: team7, setState: setTeam7, label: 'Team 7', number :7 },
							{ state: team8, setState: setTeam8, label: 'Team 8', number :8 },
							{ state: team9, setState: setTeam9, label: 'Team 9', number :9 },
							{ state: team10, setState: setTeam10, label: 'Team 10', number :10 },
						].map((team, index) => (
							<Grid item xs={12} sm={6} md={4} key={index}>
                                <Autocomplete
                                    multiple
                                    options={getAvailablePlayers(team.state)}
                                    value={team.state}
                                    clearIcon={false}
                                    onChange={(_, newValue) => {
                                        team.setState(newValue);
                                        setHasChanges(true);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={team.label}
                                            variant="outlined"
                                        />
                                    )}
                                    disabled={isSaving}
                                />
                        </Grid>
						))}
					</Grid>

				</>
			) : (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
					<div>Preparing Team Input Console... </div>
					<CircularProgress />
				</div>
			)}
		</>
	);
}