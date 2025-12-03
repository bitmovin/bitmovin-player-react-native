import { ComponentRef } from 'react';
import { NativePlayerView } from './native';

export interface PlayerViewRef extends ComponentRef<typeof NativePlayerView> {}
