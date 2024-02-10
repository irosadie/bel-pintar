import { atom } from 'recoil';

export type DataPlaying = {
  bellName: string;
  bellTime: string;
  audioName: string;
};

export type DataProps = {
  notification: boolean;
  playing: boolean;
  data: DataPlaying | null;
};

export const isShowPlayingCard = atom<DataProps>({
  key: 'showPlayingCard',
  default: {
    notification: false,
    playing: false,
    data: null,
  },
});
