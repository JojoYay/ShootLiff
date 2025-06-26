'use client';
import { useEffect, useState, SetStateAction } from 'react';
import { Avatar, Button, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography, FormControl, InputLabel, MenuItem, Select, Box, Checkbox, List, ListItem, ListItemIcon, ListItemText, IconButton, Paper, Accordion, AccordionSummary, AccordionDetails, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface BalanceOption {
    key: string;
    label: string;
    selected: boolean;
}

interface Condition {
    key: string;
    label: string;
    enabled: boolean;
    type?: string;
    options?: BalanceOption[];
    balanceEnabled?: boolean;  // バランス調整の有効/無効を管理
}

// 年齢グループを返す関数
const getAgeGroup = (birthday: string | undefined): string => {
    if (!birthday) return 'unknown';
    const birthYear = Number(birthday.split('-')[0]);
    if (isNaN(birthYear)) return 'unknown';
    const now = new Date();
    const age = now.getFullYear() - birthYear;
    const group = Math.floor(age / 3) * 3;
    return `${group}～${group + 2}歳`;
};

// チームポイントを取得する関数
const getTeamPoints = (name: string, eventResult: any[][] | null): number => {
    const userStats = eventResult?.find(stat => stat[1] === name);
    return userStats ? Number(userStats[8]) || 0 : 0;
};

// 年齢を取得する関数
const getAge = (name: string, users: string[][] | null): number => {
    const user = users?.find(u => u[1] === name);
    if (!user || !user[6]) return 0;
    const birthYear = Number(user[6].split('-')[0]);
    if (isNaN(birthYear)) return 0;
    const now = new Date();
    return now.getFullYear() - birthYear;
};

// グループの平均ポイントを計算する関数
const calculateAveragePoints = (group: string[], eventResult: any[][] | null): number => {
    let validCount = 0;
    const totalPoints = group.reduce((sum, name) => {
        const points = getTeamPoints(name, eventResult);
        if (points > 0) {
            validCount++;
            return sum + points;
        }
        return sum;
    }, 0);
    return validCount > 0 ? totalPoints / validCount : 0;
};

// 年齢の平均を計算する関数
const calculateAverageAge = (group: string[], users: string[][] | null): number => {
    let validCount = 0;
    const totalAge = group.reduce((sum, name) => {
        const user = users?.find(u => u[1] === name);
        if (!user || !user[6]) return sum;
        const birthYear = Number(user[6].split('-')[0]);
        if (isNaN(birthYear)) return sum;
        const now = new Date();
        const age = now.getFullYear() - birthYear;
        validCount++;
        return sum + age;
    }, 0);
    return validCount > 0 ? totalAge / validCount : 0;
};

// 選択されているバランス調整の種類を取得
const getSelectedBalanceType = (conditions: Condition[]): string => {
    const balanceCondition = conditions.find(c => c.key === 'balance');
    if (!balanceCondition) return 'points';
    const selectedOption = balanceCondition.options?.find(opt => opt.selected);
    return selectedOption?.key || 'points';
};

// グループの平均値を計算する関数
const calculateGroupAverage = (
    group: string[],
    conditions: Condition[],
    eventResult: any[][] | null,
    users: string[][] | null
): number => {
    const balanceType = getSelectedBalanceType(conditions);
    if (balanceType === 'points') {
        return calculateAveragePoints(group, eventResult);
    } else {
        return calculateAverageAge(group, users);
    }
};

// グループを平均値でソートする関数
const sortGroupsByAverage = (
    groups: string[][],
    conditions: Condition[],
    eventResult: any[][] | null,
    users: string[][] | null
): string[][] => {
    // 各グループ内のメンバーをポイント順にソート
    const sortedGroups = groups.map(group => {
        return group.sort((a, b) => {
            const pointsA = getTeamPoints(a, eventResult);
            const pointsB = getTeamPoints(b, eventResult);
            return pointsB - pointsA; // 降順（ポイントの高い順）
        });
    });

    // グループ全体を平均値でソート
    return sortedGroups.sort((a, b) => {
        const avgA = calculateGroupAverage(a, conditions, eventResult, users);
        const avgB = calculateGroupAverage(b, conditions, eventResult, users);
        return avgB - avgA;
    });
};

// グループ分け用の関数
const getGroupKey = (
    name: string,
    condKey: string,
    conditions: Condition[],
    eventResult: any[][] | null,
    users: string[][] | null
): string => {
    const user = users?.find(u => u[1] === name);
    if (!user) return 'unknown';
    switch (condKey) {
        case 'kanji':
            return user[3] === '幹事' ? 'kanji' : 'other';
        case 'position':
            return user[5] || 'unknown';
        case 'balance':
            const balanceType = getSelectedBalanceType(conditions);
            if (balanceType === 'points') {
                const points = getTeamPoints(name, eventResult);
                return `${Math.floor(points / 100) * 100}～${Math.floor(points / 100) * 100 + 99}点`;
            } else {
                return getAgeGroup(user[6]);
            }
        case 'tier':
            return user[8] || 'unknown';
        default:
            return 'unknown';
    }
};

// 再帰的にグループ分け
const groupRecursive = (
    members: string[],
    condIdx: number,
    activeConditions: Condition[],
    eventResult: any[][] | null,
    users: string[][] | null,
    parentGroups: string[] = []
): string[][] => {
    if (condIdx >= activeConditions.length) {
        // 最後はシャッフルして返す
        console.log(`最終グループ [${parentGroups.join(' → ')}]:`, members);
        return [members.sort(() => Math.random() - 0.5)];
    }
    const condKey = activeConditions[condIdx].key;
    // グループ分け
    const groupMap: { [key: string]: string[] } = {};
    members.forEach(name => {
        const key = getGroupKey(name, condKey, activeConditions, eventResult, users);
        if (!groupMap[key]) groupMap[key] = [];
        groupMap[key].push(name);
    });

    // グループ分けの結果をログ表示
    console.log(`\n${activeConditions[condIdx].label}でグループ分け [${parentGroups.join(' → ')}]:`);
    Object.entries(groupMap).forEach(([key, group]) => {
        console.log(`${key}: ${group.join(', ')}`);
    });

    // 各グループごとに次の条件で再帰
    let result: string[][] = [];
    Object.entries(groupMap).forEach(([key, group]) => {
        const newParentGroups = [...parentGroups, `${activeConditions[condIdx].label}(${key})`];
        result = result.concat(groupRecursive(group, condIdx + 1, activeConditions, eventResult, users, newParentGroups));
    });
    return result;
};

// 子供メンバーかどうかを判定する関数
// _Child または _Child + 数字（例：Yamada_Child1, Kawano_Child2）で終わる名前を判定
const isChildMember = (name: string): boolean => {
    return name.endsWith('_Child') || /_Child\d+$/.test(name);
};

// 大人メンバーかどうかを判定する関数
const isAdultMember = (name: string): boolean => {
    return !isChildMember(name);
};

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
	const [eventResult, setEventResult] = useState<any[][] | null>(null);
    const [users, setUsers] = useState<string[][] | null>(null);
    const [members, setMembers] = useState<string[]>([]);
    const [groupedMembers, setGroupedMembers] = useState<string[][]>([]);

    const initialConditions: Condition[] = [
        { key: 'kanji', label: '幹事をばらけさせる', enabled: true },
        { key: 'position', label: 'ポジションを考慮', enabled: false },
        { key: 'tier', label: 'Tierを考慮', enabled: false },
        { key: 'balance', label: 'チーム平均点調整', enabled: true, type: 'radio', options: [
            { key: 'points', label: '岡本ポイント', selected: true },
            { key: 'age', label: '年齢', selected: false }
        ], balanceEnabled: false},
        { key: 'includeChildren', label: '子供を含める', enabled: false },
    ];

    const [conditions, setConditions] = useState<Condition[]>(initialConditions);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const url = process.env.SERVER_URL + `?func=getTeams&func=getUsers&func=getStats`;
            if (url) {
                const response = await fetch(url, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
                const teamData:string[][] = data.teams as string[][];
                setUsers(data.users);
                setEventResult(data.stats);

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
                setMembers(playerNames);
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
                    // console.log(key + '==' + String(value) +" " + value);
                    formData.append(key, String(value));
                }
			});
            
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
        console.log(teams);
        teams?.forEach(playerData => {
            // console.log(playerData);
            const player = playerData;
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
        console.log("userToAssign",userToAssign);

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
        console.log(teamNumber);
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

        // チーム内の大人と子供の数を計算
        const adultCount = players.filter(isAdultMember).length;
        const childCount = players.filter(isChildMember).length;

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
                    {players.length > 0 && (
                        <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '8px' }}>
                            {`(大人: ${adultCount}人`}
                            {childCount > 0 ? `, 子供: ${childCount}人` : ''}
                            {`)`}
                        </span>
                    )}
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

    const totalMembers = team1.length + team2.length + team3.length + team4.length + team5.length + team6.length + team7.length + team8.length + team9.length + team10.length + unassignedUsers.length;
    
    // 大人と子供の数を計算
    const allCurrentMembers = [
        ...team1, ...team2, ...team3, ...team4, ...team5,
        ...team6, ...team7, ...team8, ...team9, ...team10, ...unassignedUsers
    ];
    const adultMembers = allCurrentMembers.filter(isAdultMember).length;
    const childMembers = allCurrentMembers.filter(isChildMember).length;

    const [selectedTeamCount, setSelectedTeamCount] = useState<number>(2); // デフォルトのチーム数を設定

    const handleRandomAllocate = () => {
        // すべてのメンバー名
        const allMembers = [
            ...team1, ...team2, ...team3, ...team4, ...team5,
            ...team6, ...team7, ...team8, ...team9, ...team10, ...unassignedUsers
        ];

        // 大人と子供を分離
        const adultMembers = allMembers.filter(isAdultMember);
        const childMembers = allMembers.filter(isChildMember);

        // 子供を含めるかどうかの条件を取得
        const includeChildrenCondition = conditions.find(c => c.key === 'includeChildren');
        const includeChildren = includeChildrenCondition?.enabled ?? false;

        // 条件の有効・優先順リスト（子供を含める条件は除外）
        const activeConditions = conditions.filter(c => c.enabled && c.key !== 'includeChildren');

        // 新しいチーム分けロジック
        const newTeams: string[][] = Array.from({ length: selectedTeamCount }, () => []);

        // 大人メンバーのチーム分け
        console.log('\n=== 大人メンバーのチーム分け開始 ===');
        let adultGroupedLists = groupRecursive(adultMembers, 0, activeConditions, eventResult, users);
        console.log('\n=== 大人メンバーの最終的なグループ分け結果 ===');
        adultGroupedLists.forEach((group, index) => {
            console.log(`大人グループ${index + 1}: ${group.join(', ')}`);
        });

        // 大人グループの順序をシャッフル
        adultGroupedLists = adultGroupedLists.sort(() => Math.random() - 0.5);

        const balanceCondition = conditions.find(c => c.key === 'balance');
        const balanceEnabled = balanceCondition?.balanceEnabled ?? false;
        const balanceType = getSelectedBalanceType(conditions);

        if (balanceEnabled) {
            // バランス調整を考慮して大人グループをソート
            adultGroupedLists = sortGroupsByAverage(adultGroupedLists, conditions, eventResult, users);
            console.log(`\n=== 大人メンバー ${balanceType === 'points' ? '岡本ポイント' : '年齢'}考慮後のグループ分け結果 ===`);
            adultGroupedLists.forEach((group, index) => {
                console.log(`大人グループ${index + 1}: ${group.join(', ')}`);
            });
        }

        // 大人グループの順序を再度シャッフル
        adultGroupedLists = adultGroupedLists.sort(() => Math.random() - 0.5);

        // 大人メンバーを各グループ内でソート
        const sortedAdultGroups = adultGroupedLists.map(group => {
            return group.sort((a, b) => {
                if (balanceEnabled) {
                    if (balanceType === 'points') {
                        const pointsA = getTeamPoints(a, eventResult);
                        const pointsB = getTeamPoints(b, eventResult);
                        return pointsB - pointsA; // 降順（ポイントの高い順）
                    } else {
                        const ageA = getAge(a, users);
                        const ageB = getAge(b, users);
                        return ageB - ageA; // 降順（年齢の高い順）
                    }
                } else {
                    // バランス調整が無効の場合はランダムにソート
                    return Math.random() - 0.5;
                }
            });
        });

        // 大人メンバーを蛇行パターンでチームに割り当て
        sortedAdultGroups.forEach((group, groupIndex) => {
            group.forEach((member, memberIndex) => {
                // 蛇行パターンの計算
                const isEvenGroup = groupIndex % 2 === 0;
                const teamIndex = isEvenGroup ? 
                    memberIndex % selectedTeamCount : 
                    selectedTeamCount - 1 - (memberIndex % selectedTeamCount);
                
                newTeams[teamIndex].push(member);
            });
        });

        // 子供を含める場合の処理
        if (includeChildren && childMembers.length > 0) {
            console.log('\n=== 子供メンバーのチーム分け開始 ===');
            
            // 子供メンバーをランダムにシャッフル
            const shuffledChildMembers = [...childMembers].sort(() => Math.random() - 0.5);
            console.log(`子供メンバー: ${shuffledChildMembers.join(', ')}`);

            // 子供メンバーをチームに均等に分配
            shuffledChildMembers.forEach((child, index) => {
                const teamIndex = index % selectedTeamCount;
                newTeams[teamIndex].push(child);
            });

            console.log('\n=== 子供メンバーのチーム分配結果 ===');
            newTeams.forEach((team, index) => {
                const childrenInTeam = team.filter(isChildMember);
                if (childrenInTeam.length > 0) {
                    console.log(`チーム${index + 1}の子供: ${childrenInTeam.join(', ')}`);
                }
            });
        }

        // 子供を含めない場合は、子供メンバーを未所属に移動
        if (!includeChildren) {
            setUnassignedUsers(childMembers);
        } else {
            setUnassignedUsers([]); // 子供を含める場合は未所属ユーザーをリセット
        }

        // 新しいチームを設定
        setTeam1(newTeams[0] || []);
        setTeam2(newTeams[1] || []);
        setTeam3(newTeams[2] || []);
        setTeam4(newTeams[3] || []);
        setTeam5(newTeams[4] || []);
        setTeam6(newTeams[5] || []);
        setTeam7(newTeams[6] || []);
        setTeam8(newTeams[7] || []);
        setTeam9(newTeams[8] || []);
        setTeam10(newTeams[9] || []);

        // チーム分け完了後の各チームの平均点を表示
        console.log('\n=== チーム分け完了後の各チームの平均 ===');
        newTeams.forEach((team, index) => {
            if (team.length > 0) {
                const adultMembersInTeam = team.filter(isAdultMember);
                if (adultMembersInTeam.length > 0) {
                    const avg = calculateGroupAverage(adultMembersInTeam, conditions, eventResult, users);
                    const unit = balanceEnabled ? 
                        (balanceType === 'points' ? '点' : '歳') : 
                        '';
                    console.log(`チーム${index + 1} (大人平均${avg.toFixed(1)}${unit}): ${team.join(', ')}`);
                } else {
                    console.log(`チーム${index + 1}: ${team.join(', ')}`);
                }
            }
        });

        // 人数が多い順にチームを入れ替え
        console.log('\n=== 人数によるチーム並び替え ===');
        const teamSizes = newTeams.map((team, index) => ({
            teamIndex: index,
            size: team.length,
            members: team
        })).filter(team => team.size > 0);

        // 人数の多い順にソート
        teamSizes.sort((a, b) => b.size - a.size);

        console.log('人数順（多い順）:');
        teamSizes.forEach((team, index) => {
            const adultCount = team.members.filter(isAdultMember).length;
            const childCount = team.members.filter(isChildMember).length;
            console.log(`${index + 1}位: チーム${team.teamIndex + 1} (${team.size}人 - 大人:${adultCount}人, 子供:${childCount}人)`);
        });

        // 人数順にチームを再配置
        const reorderedTeams: string[][] = Array.from({ length: selectedTeamCount }, () => []);
        teamSizes.forEach((team, index) => {
            reorderedTeams[index] = team.members;
        });

        // 人数順に並び替えたチームを設定
        setTeam1(reorderedTeams[0] || []);
        setTeam2(reorderedTeams[1] || []);
        setTeam3(reorderedTeams[2] || []);
        setTeam4(reorderedTeams[3] || []);
        setTeam5(reorderedTeams[4] || []);
        setTeam6(reorderedTeams[5] || []);
        setTeam7(reorderedTeams[6] || []);
        setTeam8(reorderedTeams[7] || []);
        setTeam9(reorderedTeams[8] || []);
        setTeam10(reorderedTeams[9] || []);

        console.log('\n=== 人数順並び替え後の最終結果 ===');
        reorderedTeams.forEach((team, index) => {
            if (team.length > 0) {
                const adultCount = team.filter(isAdultMember).length;
                const childCount = team.filter(isChildMember).length;
                console.log(`チーム${index + 1} (${team.length}人 - 大人:${adultCount}人, 子供:${childCount}人): ${team.join(', ')}`);
            }
        });

        setHasChanges(true); // 変更フラグを設定
    };

    // 順番入れ替え
    const moveCondition = (index: number, direction: 'up' | 'down') => {
        const newConditions = [...conditions];
        if (direction === 'up' && index > 0) {
            [newConditions[index - 1], newConditions[index]] = [newConditions[index], newConditions[index - 1]];
        }
        if (direction === 'down' && index < newConditions.length - 1) {
            [newConditions[index + 1], newConditions[index]] = [newConditions[index], newConditions[index + 1]];
        }
        setConditions(newConditions);
    };

    // オン・オフ切り替え
    const toggleCondition = (index: number) => {
        const newConditions = [...conditions];
        if (newConditions[index].key === 'balance') {
            // バランス調整の場合は、選択肢の切り替え
            const options = newConditions[index].options || [];
            const currentSelected = options.findIndex(opt => opt.selected);
            options.forEach((opt, i) => {
                opt.selected = i === (currentSelected + 1) % options.length;
            });
        } else {
            // その他の条件は通常のオン・オフ切り替え
            newConditions[index].enabled = !newConditions[index].enabled;
        }
        setConditions(newConditions);
    };

    // グループ分け実行
    const executeGrouping = () => {
        // 条件の有効・優先順リスト
        const activeConditions = conditions.filter(c => c.enabled);

        // グループ分け実行
        const groups = groupRecursive(members, 0, activeConditions, eventResult, users);

        // グループを平均値でソート
        const sortedGroups = sortGroupsByAverage(groups, conditions, eventResult, users);

        // 結果を表示
        setGroupedMembers(sortedGroups);

        // バランス調整を考慮してグループをソート
        const balanceType = getSelectedBalanceType(conditions);
        console.log(`\n=== ${balanceType === 'points' ? '岡本ポイント' : '年齢'}考慮後のグループ分け結果 ===`);
        sortedGroups.forEach((group, index) => {
            const avg = calculateGroupAverage(group, conditions, eventResult, users);
            console.log(`グループ${index + 1} (平均${avg.toFixed(1)}${balanceType === 'points' ? '点' : '歳'}): ${group.join(', ')}`);
        });
    };

    return (
        <>
            {teams.length > 0 ? (
                <>
                    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 1 }}>
                        <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {`Total Adult Members: ${adultMembers}`}
                            </Typography>
                            {childMembers > 0 && (
                                <Typography variant="body2">
                                    {`Total Child Members: ${childMembers}`}
                                </Typography>
                            )}
                        </Box>
                        <Box>
                            <Button
                                variant="contained"
                                onClick={handleSaveAll}
                                disabled={isSaving || !hasChanges}
                            >
                                {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
                            </Button>
                        </Box>
                    </Box>
                    <Box style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: 1 }}>
                        <Box>
                            <Select
                                value={selectedTeamCount}
                                onChange={(e) => setSelectedTeamCount(Number(e.target.value))}
                                variant="outlined"
                                size='small'
                                style={{ marginRight: '10px' }}
                            >
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                                    <MenuItem key={count} value={count}>{count}</MenuItem>
                                ))}
                            </Select>
                            <Button
                                variant="contained"
                                onClick={handleRandomAllocate}
                                disabled={isSaving}
                            >
                                {isSaving ? <CircularProgress size={24} /> : 'AIで配置'}
                            </Button>
                        </Box>
                    </Box>

                    {/* 条件指定UI */}
                    <Accordion sx={{ mt: 2, mb: 2 }} defaultExpanded={false}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="condition-content"
                            id="condition-header"
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                AI配置の条件と優先順位
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                {conditions.map((cond, idx) => (
                                    <ListItem
                                        key={cond.key}
                                        secondaryAction={
                                            cond.key !== 'balance' && cond.key !== 'includeChildren' && (
                                                <Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => moveCondition(idx, 'up')}
                                                        disabled={idx === 0}
                                                        aria-label="上へ"
                                                    >
                                                        <ArrowUpward fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => moveCondition(idx, 'down')}
                                                        disabled={idx === conditions.length - 1}
                                                        aria-label="下へ"
                                                    >
                                                        <ArrowDownward fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )
                                        }
                                    >
                                        {cond.key !== 'balance' && (
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={cond.enabled}
                                                    tabIndex={-1}
                                                    disableRipple
                                                    onChange={() => toggleCondition(idx)}
                                                />
                                            </ListItemIcon>
                                        )}
                                        <ListItemText 
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {cond.label}
                                                    {cond.type === 'radio' && cond.enabled && (
                                                        <Checkbox
                                                            size="small"
                                                            checked={cond.balanceEnabled}
                                                            onChange={(e) => {
                                                                const newConditions = [...conditions];
                                                                newConditions[idx].balanceEnabled = e.target.checked;
                                                                setConditions(newConditions);
                                                            }}
                                                            sx={{ ml: 1 }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                cond.type === 'radio' && cond.enabled && cond.balanceEnabled ? (
                                                    <FormControl component="fieldset">
                                                        <RadioGroup
                                                            value={cond.options?.find(opt => opt.selected)?.key || 'points'}
                                                            onChange={(e) => {
                                                                const newConditions = [...conditions];
                                                                const balanceCondition = newConditions[idx];
                                                                if (balanceCondition.options) {
                                                                    balanceCondition.options.forEach(opt => {
                                                                        opt.selected = opt.key === e.target.value;
                                                                    });
                                                                    setConditions(newConditions);
                                                                }
                                                            }}
                                                        >
                                                            {cond.options?.map(option => (
                                                                <FormControlLabel
                                                                    key={option.key}
                                                                    value={option.key}
                                                                    control={<Radio size="small" />}
                                                                    label={option.label}
                                                                />
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                ) : null
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>

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