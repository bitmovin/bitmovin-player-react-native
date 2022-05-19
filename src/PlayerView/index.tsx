import React from 'react';
import {
  PlayerViewNativeComponent,
  PlayerViewNativeComponentProps,
} from './PlayerViewNativeComponent';

export interface PlayerViewProps extends PlayerViewNativeComponentProps {
  // TODO: list react player props.
}

export const PlayerView: React.FC<PlayerViewProps> = (props) => {
  // TODO: handle lifecycle events (eg. native player create/dispose), event emitter subscriptions etc.
  return <PlayerViewNativeComponent {...props} />;
};
