import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Button, Text, ScrollView } from 'react-native';
import {
    Event,
    PlaylistTransitionEvent,
    usePlayer,
    PlayerView,
    SourceType,
    SourceConfig,
    Source,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import { useFocusEffect } from '@react-navigation/native';

function prettyPrint(header: string, obj: any) {
    console.log(header, JSON.stringify(obj, null, 2));
}

const Source1: SourceConfig = {
    url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    type: SourceType.HLS,
    title: 'Art of Motion',
};

const Source2: SourceConfig = {
    url: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    type: SourceType.HLS,
    title: 'Sintel',
};

const Source3: SourceConfig = {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: SourceType.HLS,
    title: 'Big Buck Bunny',
};

export default function PlaylistPlayback() {
    useTVGestures();

    const [sources, setSources] = useState<Source[]>([]);
    const [activeSource, setActiveSource] = useState<SourceConfig | undefined>(undefined);

    const player = usePlayer({
        playbackConfig: {
            isAutoplayEnabled: true,
        },
    });

    const onEvent = useCallback((event: Event) => {
        prettyPrint(`EVENT [${event.name}]`, event);
    }, []);

    const onPlaylistTransition = useCallback((event: PlaylistTransitionEvent) => {
        prettyPrint(`EVENT [${event.name}]`, event);
        setActiveSource(event.to.config);
    }, []);

    const addSource = useCallback((config: SourceConfig) => {
        player.playlist.add(new Source(config));
    }, [player]);

    const removeSource = useCallback((index: number) => {
        player.playlist.removeAt(index);
    }, [player]);

    const refreshSources = useCallback(async () => {
        const currentSources = await player.playlist.sources;
        setSources(currentSources);
    }, [player]);

    useFocusEffect(
        useCallback(() => {
            player.load({
                sources: [Source1, Source2, Source3],
            });
            return () => {
                player.destroy();
            };
        }, [player])
    );

    React.useEffect(() => {
        player.onSourceAdded = (event) => {
            console.log('EVENT [SourceAdded]', event);
            refreshSources();
        };
        player.onSourceRemoved = (event) => {
            console.log('EVENT [SourceRemoved]', event);
            refreshSources();
        };
        return () => {
            player.onSourceAdded = undefined;
            player.onSourceRemoved = undefined;
        };
    }, [player, refreshSources]);

    return (
        <View style={styles.container}>
            <View style={styles.playerContainer}>
                <PlayerView
                    player={player}
                    style={styles.player}
                    onPlaylistTransition={onPlaylistTransition}
                    onSourceLoaded={onEvent}
                    onPlay={onEvent}
                    onPaused={onEvent}
                />
            </View>
            <View style={styles.controls}>
                <Text style={styles.title}>Playlist Controls</Text>
                <Text>Active Source: {activeSource?.title ?? 'None'}</Text>
                <View style={styles.buttonRow}>
                    <Button title="Add Art of Motion" onPress={() => addSource(Source1)} />
                    <Button title="Add Sintel" onPress={() => addSource(Source2)} />
                    <Button title="Add BBB" onPress={() => addSource(Source3)} />
                </View>
                <Text style={styles.subtitle}>Current Playlist ({sources.length})</Text>
                <ScrollView style={styles.list}>
                    {sources.map((s, index) => (
                        <View key={index} style={styles.listItem}>
                            <Text>{index}. {s.config?.title}</Text>
                            <Button title="Remove" onPress={() => removeSource(index)} />
                        </View>
                    ))}
                </ScrollView>
                <Button title="Refresh Sources" onPress={refreshSources} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    playerContainer: {
        height: 300,
        backgroundColor: 'black',
    },
    player: {
        flex: 1,
    },
    controls: {
        flex: 1,
        padding: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    list: {
        flex: 1,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});
