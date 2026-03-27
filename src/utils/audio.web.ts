// expo-audio is not available on web — provide no-op stubs

const noopRecorder = {
  uri: null,
  currentTime: 0,
  prepareToRecordAsync: async () => {},
  record: () => {},
  stop: async () => {},
};

export const useAudioRecorder = (_preset?: any) => noopRecorder;

export const createAudioPlayer = (_uri: string) => ({
  play: () => {},
  remove: () => {},
  addListener: () => {},
});

export const requestRecordingPermissionsAsync = async () => ({ granted: false });

export const setAudioModeAsync = async (_opts: any) => {};

export const RecordingPresets = {
  HIGH_QUALITY: {},
};

export const audioAvailable = false;
