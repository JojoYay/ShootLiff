import { Box, styled } from '@mui/system';
import { CardActionArea, Card, CardMedia, Typography, Table, TableHead, TableRow, TableCell, TableBody, Grid, Button, LinearProgress, CircularProgress } from '@mui/material';
import AvatarIcon from '../stats/avatarIcon';
import { useRef, useState } from 'react';
import YouTubeComment from '../calendar/youTubeComment';

const Overlay2 = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  // background: 'linear-gradient(rgba(0,0,0,1),rgba(0,0,0,0))',
  zIndex: 2,

});

const Overlay = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '50%',
  background: 'linear-gradient(rgba(0,0,0,1),rgba(0,0,0,0))',
  zIndex: 1,
});

const Media = styled(CardMedia)({
  position: 'relative',
  height: '160px',
}) as any;

function getPicUrl(url: string): string {
  const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL ' + url);
  }
  const videoId:string = videoIdMatch[1];
  // alert(videoId);
  // return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

type VideoPropsNeo = {
  url: string;
  title: string;
  matchId: string;
  // date: string;
  team1Name:string;
  team2Name:string;
  team1Member: string;
  team2Member: string;
  team1Score: string;
  team2Score: string;
  winTeam: string;
  shootLog:string[][] | null;
  users:string[][];
  actDate:string;
  // clientId:string;
  // clientSecret:string;
  fetchVideo: () =>{};
  kanji:boolean;
};

export default function VideoCardNeo(props: VideoPropsNeo) {
  const handleCardClick = () => {
    window.open(props.url, '_blank');
  };

  const UserIcon = ({ userName }: { userName: string }) => {
    // console.log("userIcon");
    const matchedUser = props.users.find(user => user[1] === userName); // userNameとマッチするユーザーを検索
    const imageUrl = matchedUser ? matchedUser[4] : undefined; // マッチしたユーザーの5列目をimageUrlに設定

    return (
      <AvatarIcon
        name={userName} picUrl={imageUrl}
        width={24} height={24} showTooltip={true}
      />
    )
  };


const fileInputRef = useRef<HTMLInputElement>(null);
const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // モーダル表示用 state を追加
const [uploadProgress, setUploadProgress] = useState<number>(0);

// ファイル選択時の処理
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('handleFileChange called');
  const file = event.target.files?.[0];
  console.log('Selected file:', file);
  if (!file) {
    alert('ファイルが選択されませんでした。');
    return;
  }
  console.log('File details:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  uploadVideo(file);
 
};

const uploadVideo = async(file: File) => {
    console.log('uploadVideo called with file:', file);
    if (!file) return alert("動画を選択してください");

    setIsModalOpen(true); // モーダルを開く
    console.log('Modal opened');
    try{
      const url = process.env.NEXT_PUBLIC_SERVER_URL + '';
      console.log('Server URL:', url);
      const formData:FormData = new FormData();
      formData.append('func', 'uploadToYoutube');
      formData.append('fileName', props.title);
      formData.append('fileType', file.type);
      formData.append('fileSize', file.size.toString());
      formData.append('actDate', props.actDate);
      console.log('FormData prepared:', {
        func: 'uploadToYoutube',
        fileName: props.title,
        fileType: file.type,
        fileSize: file.size,
        actDate: props.actDate
      });
      
      // アップロード用のURLとトークンを取得するためのリクエスト
      console.log('Sending fetch request to:', url);
      const res = await fetch(url, {
        method: "POST",
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      console.log('Fetch response status:', res.status);
      console.log('Fetch response ok:', res.ok);

      if (!res.ok) {
        console.error('HTTP error response:', res.status, res.statusText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const responseData = await res.json();
      console.log('Response data:', responseData);
      const { uploadUrl, token, err } = responseData;
      console.log('uploadUrl:', uploadUrl);
      console.log('token:', token);
      console.log('err:', err);
      setUploadProgress(10);

      if (err) {
        console.error('Server returned error:', err);
        alert(`アップロードエラー: ${err}`);
        return;
      }
      if (!uploadUrl) {
        console.error('No upload URL received');
        alert("アップロードURLの取得に失敗しました");
        return;
      }

      // Resumable Upload を開始
      console.log('Starting resumable upload...');
      const chunkSize = 2 * 1024 * 1024; // 2MB チャンク
      let offset = 0;
      let response;
      
      while (offset < file.size) {
        const progress = Math.min(90, 10 + Math.round((offset / file.size) * 80));
        console.log(`Uploading chunk: ${offset}-${offset + chunkSize - 1}/${file.size}, progress: ${progress}%`);
        try{
          const chunk = file.slice(offset, offset + chunkSize);
          setUploadProgress(progress);
          
          console.log(`Sending chunk request to: ${uploadUrl}`);
          response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Length": `${chunk.size}`,
              "Content-Range": `bytes ${offset}-${offset + chunk.size - 1}/${file.size}`,
            },
            body: chunk,
          });
          
          console.log(`チャンクアップロード成功 bytes ${offset}-${offset + chunk.size - 1}/${file.size}, status: ${response.status}`);
        } catch(e: any) {
          console.error('Chunk upload error:', e);
          //fixme なぜかエラーになるが無視することでアップはできているっぽい=> no-corsで回避
        } finally {
          setUploadProgress(progress);
        }
        offset += chunkSize;
      }

      // アップロード完了後の処理
      console.log('Upload completed, starting update process...');
      try {
        const updateUrl = process.env.NEXT_PUBLIC_SERVER_URL + '?func=updateYTVideo&actDate=' + encodeURIComponent(props.actDate) +'&fileName='+encodeURIComponent(props.title);
        console.log('Update URL:', updateUrl);
        if (updateUrl) {
          const updateResponse = await fetch(updateUrl, {
            method: 'GET',
          });
          console.log('Update response status:', updateResponse.status);
          const data = await updateResponse.json();
          console.log('Update response data:', data);
          if(data.err){
            console.error('Update error:', data.err);
            alert(`更新エラー: ${data.err}`);
          } else {
            console.log('Update successful, calling fetchVideo');
            // alert("動画がアップロードされました！");
            props.fetchVideo();
          }
        }
      } catch (error) {
        console.error('更新処理エラー:', error);
        alert('動画の更新処理中にエラーが発生しました');
      }
      
      setUploadProgress(100);
      console.log('Upload process completed successfully');
      
    } catch (error) {
      console.error('ファイル処理エラー:', error);
      alert(`ファイル処理エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      console.log('Closing modal');
      setIsModalOpen(false);
    }
}

  return (
    <>
      <Card style={{ borderRadius: '15px', overflow: 'hidden', width: '100%', marginBottom:'10px' }}>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
          {props.url ? (
            <>
              <CardActionArea onClick={handleCardClick} style={{width: '100%' }} >
                  <Media
                      component="img"
                      alt="Image"
                      height="160"
                      width='100%'
                      image={getPicUrl(props.url)}
                      title="Image"
                      style={{ borderRadius: '15px' }} // ここでもborderRadiusを設定
                  />
                  <Overlay>
                      <Typography variant="h5" style={{ color: 'white', paddingTop: '10px', paddingLeft: '10px', borderRadius: '15px' }}>
                          {props.title}
                      </Typography>
                  </Overlay>
              </CardActionArea>
            </>
          ) : (
            <CardActionArea>
              <Typography height={'160px'}  variant="h4" style={{ color: 'white', fontWeight: 'bold', backgroundColor: 'grey', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                No Video
              </Typography>
              <Overlay>
                <Typography variant="h5" style={{ color: 'white', paddingTop: '10px', paddingLeft: '10px' }}>
                  {props.title}
                </Typography>
              </Overlay>
              {props.kanji? (
              <Overlay2>
                <Box style={{ zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '90%', padding: '20px' }}>
                  {isModalOpen ? (
                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px' }}>
                      <LinearProgress style={{width:'100%', height:'8px', marginBottom:'8px'}} variant="determinate" value={uploadProgress}/>
                      <Typography variant="body2" style={{ color: 'white', marginBottom: '8px', textAlign: 'center' }}>
                        {uploadProgress}%
                      </Typography>
                      <Typography variant="caption" style={{ color: 'white', textAlign: 'center', fontSize: '10px' }}>
                        完了前に画面を閉じるとすべてやり直しになります
                      </Typography>
                    </Box>
                  ) : null}
                  <Typography style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {/* flexboxで縦に並べる */}
                    <Button variant="contained" color="primary" fullWidth onClick={() => {
                      fileInputRef.current?.click();
                    }}>動画をアップロード
                    </Button>
                  </Typography>
                </Box>
              </Overlay2>
              ) : null}
            </CardActionArea>
          )}
        {props.winTeam ? (
          <>
            {props.shootLog && (
            <>
              <Grid container alignItems="center" justifyContent="space-between" padding={2}>
                <Grid item xs={5}>
                  <Typography variant="body2">{props.team1Name}</Typography>
                  <Grid container wrap="wrap">
                    {props.team1Member.split(', ').map(member => (
                      <UserIcon key={member} userName={member} /> // 名前をUserIconに渡す
                    ))}
                  </Grid>
                </Grid>
                <Grid item xs={2} textAlign="center"> {/* スコアの幅を狭める */}
                  <Typography variant="h5">
                    {props.team1Score} - {props.team2Score}
                  </Typography>
                </Grid>
                <Grid item xs={5}> {/* 右側の名前の幅を広げる */}
                  <Typography variant="body2">{props.team2Name}</Typography>
                  <Grid container wrap="wrap">
                    {props.team2Member.split(', ').map(member => (
                      <UserIcon key={member} userName={member} /> // 名前をUserIconに渡す
                    ))}
                  </Grid>
                </Grid>
              </Grid>
              <Table size="small" >
                <TableHead>
                    <TableRow>
                        <TableCell>チーム</TableCell>
                        <TableCell>得点者</TableCell>
                        <TableCell>アシスト</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {props.shootLog
                  .filter(log => {
                    let logMatchId = props.matchId;
                    if (logMatchId.endsWith('d')) {
                      logMatchId = logMatchId.slice(0, -1); // 末尾の "d" を削除
                    }
                    return logMatchId === log[1];
                  })// 該当のmatchIdを持つデータをフィルタリング
                  .map((log, index) => (
                        <TableRow key={index}> {/* 行クリックで編集モードにする場合はここを修正 */}
                            <TableCell>{log[2]}</TableCell>
                            <TableCell>{log[4]}</TableCell>
                            <TableCell>{log[3] || '-'}</TableCell> { /* アシストがない場合は '-' を表示 */ }
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            </>
            )}
          </>
        ) : (<></>)}
      </Card>
      {props.url && (
        <YouTubeComment videoUrl={props.url} />
      )}
    </>
  );
}