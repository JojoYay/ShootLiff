'use client';

import { useEffect, useState, Suspense } from "react";
import { useSwipeable } from 'react-swipeable';
import { useSearchParams } from 'next/navigation';

interface Quiz {
    actualNameOrd: number;
    pictureUrl: string;
    options: string[];
}

function NameContent() {
    const searchParams = useSearchParams();
    const tabName = searchParams.get('tabName');
    
    const [users, setUsers] = useState<Quiz[]>([]);
    const [currentUserIndex, setCurrentUserIndex] = useState<number>(0);
    // const [options, setOptions] = useState<string[]>([]);
    // const [correctName, setCorrectName] = useState<string>(''); // 正解の名前を保持する state
    const [feedbackMessage, setFeedbackMessage] = useState<string>('');
    // const [remainingUserIndices, setRemainingUserIndices] = useState<number[]>([]); // remainingUserIndices state を追加


    const fetchUsers = async () => {
        try {
            const funcName = tabName ? 'getQuizData' : 'getUsers';
            let url = process.env.NEXT_PUBLIC_SERVER_URL + `?func=${funcName}`;
            if (tabName) {
                url += `&tabName=${encodeURIComponent(tabName)}`;
            }
			if (url) {
				const response = await fetch(url, {
					method: 'GET',
				});
				const data = await response.json();
				console.log(data);
                // getQuizDataの場合は既にQuiz形式のデータが返ってくる可能性があるため、分岐処理
                if (tabName && data.quizData && Array.isArray(data.quizData) && data.quizData.length > 0 && typeof data.quizData[0] === 'object' && 'pictureUrl' in data.quizData[0]) {
                    // 既にQuiz形式のデータが返ってきている場合
                    // 1行目をスキップし、シャッフル
                    const quizDataWithoutFirst = data.quizData.slice(1);
                    const shuffledQuizData = [...quizDataWithoutFirst];
                    for (let i = shuffledQuizData.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffledQuizData[i], shuffledQuizData[j]] = [shuffledQuizData[j], shuffledQuizData[i]];
                    }
                    setUsers(shuffledQuizData as Quiz[]);
                } else {
                    // getUsersの場合、またはgetQuizDataが配列形式で返ってくる場合の処理
                    const usersData = tabName && Array.isArray(data.quizData) ? data.quizData.slice(1) : data.users.slice(1); // 不要な最初の要素を削除
                    const shuffledUsers = [...usersData]; // 元の配列をコピー
                    for (let i = shuffledUsers.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
                    }
                    const quizData: Quiz[] = []; // Quiz オブジェクトを格納する配列
        
                    for (let i = 0; i < shuffledUsers.length; i++) {
                        const currentUser = shuffledUsers[i];
                        const pictureUrl = currentUser[4]; // pictureUrl を取得
                        // pictureUrlが空、または"Picture"という文字列の場合はスキップ
                        if(!pictureUrl || pictureUrl === 'Picture' || typeof pictureUrl !== 'string'){
                            continue;
                        }
                        const correctName = currentUser[1]; // 正しい名前を取得
                        // 正しい名前が空、または"伝助上の名前"という文字列の場合はスキップ
                        if(!correctName || correctName === '伝助上の名前' || typeof correctName !== 'string'){
                            continue;
                        }
                        const actualNameOrd = Math.floor(Math.random() * 4); // 0-3 のランダムな数字
        
                        const incorrectOptions: string[] = [];
                        const usedIndices = [i]; // usedIndices を初期化、現在のユーザーのインデックスを追加
                        let attempts = 0;
                        const maxAttempts = usersData.length * 2; // 最大試行回数を設定
                        while (incorrectOptions.length < 3 && attempts < maxAttempts) {
                            attempts++;
                            const randomIndex = Math.floor(Math.random() * usersData.length);

                            if (!usedIndices.includes(randomIndex)) {
                                const randomName = shuffledUsers[randomIndex][1];
                                // "伝助上の名前"という文字列は選択肢に含めない
                                if (randomName && randomName !== '伝助上の名前' && typeof randomName === 'string' && !incorrectOptions.includes(randomName)) {
                                    incorrectOptions.push(randomName);
                                    usedIndices.push(randomIndex);
                                }
                            }
                        }
                        // 3つの選択肢が揃わない場合は、既存の選択肢を繰り返し使用
                        while (incorrectOptions.length < 3) {
                            incorrectOptions.push(incorrectOptions[incorrectOptions.length % incorrectOptions.length] || '不明');
                        }
        
                        const options: string[] = Array(4); // 4つの選択肢の配列を初期化
                        options[actualNameOrd] = correctName; // 正しい名前を actualNameOrd の位置に設定
        
                        let optionIndex = 0;
                        for (let j = 0; j < 4; j++) {
                            if (j === actualNameOrd) continue; // actualNameOrd の位置はスキップ
                            options[j] = incorrectOptions[optionIndex++]; // 不正解の選択肢を設定
                        }
                        quizData.push({ pictureUrl, options, actualNameOrd }); // Quiz オブジェクトを配列に追加
                        }
                    setUsers(quizData); // users state を quizData で更新
                }
            }
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

    useEffect(() => {
        fetchUsers();
    }, [tabName]);

    const handleOptionClick = (index: number) => {
        if (index === users[currentUserIndex].actualNameOrd) {
            setFeedbackMessage('正解！');
        } else {
            setFeedbackMessage('不正解...');
        }
    };

    useEffect(() => {
        setFeedbackMessage('');
    }, [currentUserIndex]);

    const swipeHandlers = useSwipeable({
        onSwipedUp: () => handleOptionClick(0),
        onSwipedDown: () => handleOptionClick(3),
        onSwipedLeft: () => handleOptionClick(1),
        onSwipedRight: () => handleOptionClick(2),
    });


	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			{users.length > 0 && (
                currentUserIndex !== (users.length - 1) ? (
                    <>
                    <h3>アイコンクイズ</h3>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
							<div {...swipeHandlers}>
								<img
									src={users[currentUserIndex].pictureUrl}
									alt="User Photo"
									style={{ width: '100%'}}
								/>
							</div>
						</div>
					</div>
					<div style={{ fontSize: '20px' }}>{feedbackMessage}</div>
                    <div style={{ margin: '5px' }}>
                        <button style={{ padding: '10px', fontSize: '16px' }} onClick={() => handleOptionClick(0)}>{users[currentUserIndex].options[0]}</button>
					</div>
                    <div style={{ margin: '5px' }}>
						<button style={{ padding: '10px', fontSize: '16px' }} onClick={() => handleOptionClick(1)}>{users[currentUserIndex].options[1]}</button>
                    </div>
                    <div style={{ margin: '5px' }}>
                        <button style={{ padding: '10px', fontSize: '16px' }} onClick={() => handleOptionClick(2)}>{users[currentUserIndex].options[2]}</button>
                    </div>
                    <div style={{ margin: '5px' }}>
                        <button style={{ padding: '10px', fontSize: '16px' }} onClick={() => handleOptionClick(3)}>{users[currentUserIndex].options[3]}</button>
                    </div>

                    <button style={{ marginTop: '10px', padding: '10px', fontSize: '16px' }} onClick={() => setCurrentUserIndex(currentUserIndex+1)}>次の問題へ</button>
				</>
                ) : <>おしまい！</>
			)}
		</div>
	);
}

export default function Name() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <NameContent />
        </Suspense>
    );
}