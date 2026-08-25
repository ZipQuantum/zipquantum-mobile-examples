import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {zqConfig} from './src/config';
import {parseInstallReferrer, parseIosHandoff} from './src/handoff';
import {getRawInstallReferrer} from './src/native/InstallReferrer';
import {ZipQuantumPasteControl} from './src/native/ZipQuantumPasteControl';
import type {Delivery} from './src/types';
import {acknowledgeRouteOpened, recoverDeferredLink, resolveDirectLink} from './src/ZipQuantumClient';

export default function App(): React.JSX.Element {
  const [delivery, setDelivery] = useState<Delivery>();
  const [status, setStatus] = useState('Ready for a verified link');
  const acknowledged = useRef(false);

  const accept = useCallback((next: Delivery) => {
    acknowledged.current = false;
    setDelivery(next);
    setStatus(next.delivery === 'deep_link' ? 'Direct link resolved' : 'Destination restored');
  }, []);
  const fail = useCallback((error: unknown) => {
    setStatus(error instanceof Error ? error.message : 'Link resolution failed');
  }, []);

  useEffect(() => {
    const open = (url: string) => resolveDirectLink(url).then(accept).catch(fail);
    Linking.getInitialURL().then(url => {
      if (url) open(url);
    }).catch(fail);
    const subscription = Linking.addEventListener('url', event => open(event.url));
    return () => subscription.remove();
  }, [accept, fail]);

  useEffect(() => {
    if (!delivery?.route_ack || acknowledged.current) return;
    // This runs only after React has rendered the destination card.
    acknowledged.current = true;
    const host = delivery.link.host ?? new URL(delivery.link.url).host;
    acknowledgeRouteOpened(delivery.route_ack, host).catch(fail);
  }, [delivery, fail]);

  const recoverIos = (value: string) => {
    try {
      const handoff = parseIosHandoff(value, zqConfig.appIdentifier);
      recoverDeferredLink(handoff).then(accept).catch(fail);
    } catch (error) {
      fail(error);
    }
  };
  const recoverAndroid = () => {
    getRawInstallReferrer()
      .then(parseInstallReferrer)
      .then(recoverDeferredLink)
      .then(accept)
      .catch(fail);
  };

  useEffect(() => {
    if (Platform.OS === 'android') recoverAndroid();
  }, []);

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ZIPQUANTUM REFERENCE</Text>
        <Text style={styles.title}>Open the right route.</Text>
        <Text style={styles.subtitle}>No SDK. No fingerprinting. Native handoff only.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>DELIVERY STATUS</Text>
        <Text style={styles.status}>{status}</Text>
        {delivery && (
          <View style={styles.route}>
            <Text style={styles.routeType}>{delivery.delivery.replaceAll('_', ' ')}</Text>
            <Text style={styles.routeURL} numberOfLines={3}>
              {delivery.link.destination_url ?? delivery.link.url}
            </Text>
          </View>
        )}
      </View>
      {Platform.OS === 'ios' ? (
        <View style={styles.action}>
          <Text style={styles.actionTitle}>Installed from the App Store?</Text>
          <Text style={styles.actionCopy}>Use Apple’s visible paste control to restore your destination.</Text>
          <ZipQuantumPasteControl onPaste={recoverIos} />
        </View>
      ) : (
        <Pressable style={styles.button} onPress={recoverAndroid}>
          <Text style={styles.buttonText}>Retry deferred recovery</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#06140f', padding: 24, gap: 20},
  hero: {paddingTop: 28, gap: 8},
  eyebrow: {color: '#83ff2b', fontSize: 12, fontWeight: '800', letterSpacing: 1.8},
  title: {color: '#f5fff8', fontSize: 34, fontWeight: '800'},
  subtitle: {color: '#9bb1a4', fontSize: 16, lineHeight: 23},
  card: {backgroundColor: '#0c2018', borderColor: '#234231', borderWidth: 1, borderRadius: 22, padding: 20, gap: 10},
  label: {color: '#83ff2b', fontSize: 11, fontWeight: '800', letterSpacing: 1.4},
  status: {color: '#f5fff8', fontSize: 21, fontWeight: '700'},
  route: {backgroundColor: '#07150f', borderRadius: 14, padding: 14, gap: 5},
  routeType: {color: '#83ff2b', textTransform: 'uppercase', fontSize: 11, fontWeight: '800'},
  routeURL: {color: '#c8d8cd', fontSize: 14, lineHeight: 20},
  action: {marginTop: 'auto', gap: 10},
  actionTitle: {color: '#f5fff8', fontSize: 18, fontWeight: '700'},
  actionCopy: {color: '#9bb1a4', lineHeight: 21},
  button: {marginTop: 'auto', backgroundColor: '#83ff2b', borderRadius: 18, padding: 17, alignItems: 'center'},
  buttonText: {color: '#07150f', fontSize: 16, fontWeight: '800'},
});
