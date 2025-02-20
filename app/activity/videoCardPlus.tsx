import { styled } from '@mui/system';
import { CardActionArea, Card, CardMedia, Typography, Avatar, Table, TableHead, TableRow, TableCell, TableBody, Grid } from '@mui/material';
import AvatarIcon from '../stats/avatarIcon';

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

type VideoProps = {
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
  shootLog:string[][];
  users:string[][];
};

export default function VideoCardPlus(props: VideoProps) {
  const handleCardClick = () => {
    window.open(props.url, '_blank');
  };

const UserIcon = ({ userName }: { userName: string }) => {
  // console.log("userIcon");
  const matchedUser = props.users.find(user => user[1] === userName); // userNameとマッチするユーザーを検索
  const imageUrl = matchedUser ? matchedUser[4] : undefined; // マッチしたユーザーの5列目をimageUrlに設定

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
      <AvatarIcon
        name={userName} picUrl={imageUrl}
        width={24} height={24}
      />
    </div>
)};


  return (
    <Card style={{ margin:'5px', borderRadius: '15px', overflow: 'hidden' }}>
        {props.url ? (
            <CardActionArea onClick={handleCardClick} >
                <div style={{ position: 'relative' }}>
                    <Media
                        component="img"
                        alt="Image"
                        height="160"
                        image={getPicUrl(props.url)}
                        title="Image"
                        style={{ borderRadius: '15px' }} // ここでもborderRadiusを設定
                    />
                    <Overlay />
                </div>
                <Overlay>
                    <Typography variant="h5" style={{ color: 'white', paddingTop: '10px', paddingLeft: '10px', borderRadius: '15px' }}>
                        {props.title}
                    </Typography>
                </Overlay>
            </CardActionArea>
        ) : (
            <CardActionArea >
                <div style={{ position: 'relative', height: '160px', backgroundColor: 'grey', borderRadius: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Typography variant="h4" style={{ color: 'white', fontWeight: 'bold' }}>
                        Coming Soon!
                    </Typography>
                </div>
                <Overlay>
                    <Typography variant="h5" style={{ color: 'white', paddingTop: '10px', paddingLeft: '10px' }}>
                        {props.title}
                    </Typography>
                </Overlay>
            </CardActionArea>
        )}
      {props.winTeam ? (
        <>

<Grid container alignItems="center" justifyContent="space-between" padding={2}>
  <Grid item xs={5}> {/* 左側の名前の幅を広げる */}
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
      .filter(log => log[1] === props.matchId) // 該当のmatchIdを持つデータをフィルタリング
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
      ) : (<></>)}
    </Card>
  );
}