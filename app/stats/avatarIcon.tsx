import { Avatar } from "@mui/material";

interface AvatarIconProps {
    picUrl?: string;
    name: string;
    width: number;
    height: number;
}

function stringToColor(string: string) {
    let hash = 0;
    let i;
  
    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
  
    let color = '#';
  
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */
  
    return color;
  }
  
  function stringAvatar(name: string, width:number, height:number) {
    return {
      sx: {
        bgcolor: stringToColor(name),
        width: width, 
        height: height,
      },
      // children: (name.length > 1) ? name[0]+name[1] : name[0],
      children: name[0],
    };
  }


export default function AvatarIcon(avatarIconProps:AvatarIconProps) {
    if(avatarIconProps.picUrl){
        return (
            <Avatar sx={{ width: avatarIconProps.width, height: avatarIconProps.height }} src={avatarIconProps.picUrl} alt={avatarIconProps.name} ></Avatar>
        );
    } else {
        return (
            <Avatar {...stringAvatar(avatarIconProps.name,avatarIconProps.width,avatarIconProps.height)} />
        );
    }
}