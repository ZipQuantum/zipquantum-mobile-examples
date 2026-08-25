import React from 'react';
import {Platform, requireNativeComponent, type NativeSyntheticEvent, type ViewProps} from 'react-native';

type PasteEvent = NativeSyntheticEvent<{value: string}>;
type NativeProps = ViewProps & {onPaste: (event: PasteEvent) => void};
const NativePasteControl = Platform.OS === 'ios'
  ? requireNativeComponent<NativeProps>('ZipQuantumPasteControlViewManager')
  : null;

export function ZipQuantumPasteControl({onPaste}: {onPaste: (value: string) => void}): React.JSX.Element | null {
  if (!NativePasteControl) return null;
  return (
    <NativePasteControl
      accessibilityLabel="Restore my destination"
      onPaste={event => onPaste(event.nativeEvent.value)}
      style={{height: 52, width: '100%'}}
    />
  );
}
