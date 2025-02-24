import { styled } from '@mui/system';
import { CardActionArea, Card, CardMedia, Typography } from '@mui/material';

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
  date: string;
};

export default function VideoCard(props: VideoProps) {
  // const handleShareClick = () => {
  //   // Share logic here
  // };

  const handleCardClick = () => {
    window.open(props.url, '_blank');
  };

  return (
    <Card style={{ margin:'5px', borderRadius: '15px', width:'100%' }}>
      {props.url ? (
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
            <Typography variant="h5" style={{ color: 'white', paddingTop: '10px', paddingLeft: '10px' }}>
              {props.title}
            </Typography>
          </Overlay>
        </CardActionArea>
      ) : (
        <CardActionArea style={{width: '100%' }} >
          <Typography height={'160px'}  variant="h4" style={{ color: 'white', fontWeight: 'bold', backgroundColor: 'grey', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
            Coming Soon!
          </Typography>
          <Overlay>
            <Typography variant="h5" style={{ color: 'white', paddingTop: '10px', paddingLeft: '10px' }}>
              {props.title}
            </Typography>
          </Overlay>
        </CardActionArea>
      )}
    </Card>
  );
}