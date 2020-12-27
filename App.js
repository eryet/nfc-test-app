/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  StyleSheet,
  Settings,
  Linking,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import NfcManager, {NfcEvents, Ndef, NfcTech} from 'react-native-nfc-manager';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const RtdType = {
  URL: 0,
  TEXT: 1,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#303030',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 32,
    marginBottom: 30,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 25,
  },
  button: {
    elevation: 8,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 350,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    textTransform: 'uppercase',
  },
  whitetext: {
    color: 'white',
    fontSize: 16,
  },
  id: {
    color: 'white',
    fontSize: 22,
    marginTop: 50,
  },
  tagInfo: {
    color: 'white',
    fontSize: 22,
    marginTop: 20,
  },
});

const App = () => {
  const [info, setInfo] = useState({
    id: '空',
  });
  const [support, isSupported] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tagInfo, setTagInfo] = useState('無');

  useEffect(() => {
    NfcManager.isSupported().then(supported => {
      isSupported(supported);
    });
    NfcManager.start();
    // to listen to the discovered tags and the NdefMessage within them
    NfcManager.setEventListener(NfcEvents.DiscoverTag, tag => {
      console.warn(tag);
      setInfo(tag);
      setLoading(false);
      NfcManager.setAlertMessageIOS('I got your tag!');
      NfcManager.unregisterTagEvent().catch(() => 0);
    });
    return cleanUp;
  });

  const cleanUp = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  };

  const cancel = () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.unregisterTagEvent().catch(() => 0);
  };

  const parseUri = tag => {
    try {
      if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
        return Ndef.uri.decodePayload(tag.ndefMessage[0].payload);
      }
    } catch (e) {
      console.log(e);
    }
    return null;
  };

  const parseText = tag => {
    try {
      if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
        return Ndef.text.decodePayload(tag.ndefMessage[0].payload);
      }
    } catch (e) {
      console.log(e);
    }
    return null;
  };

  const onTagDiscovered = tag => {
    console.log('Tag Discovered', tag);
    let url = parseUri(tag);
    if (url) {
      Linking.openURL(url).catch(err => {
        console.warn(err);
      });
    }
    let text = parseText(tag);
    setTagInfo(text);
  };

  const read = async () => {
    try {
      NfcManager.registerTagEvent(onTagDiscovered)
        .then(result => {
          console.log('registerTagEvent OK', result);
        })
        .catch(error => {
          console.warn('registerTagEvent fail', error);
        });
    } catch (ex) {
      console.log(ex);
      console.warn('ex', ex);
      NfcManager.unregisterTagEvent().catch(() => 0);
    }
  };

  const buildUrlPayload = value => {
    return Ndef.encodeMessage([Ndef.uriRecord(value)]);
  };

  const write = async () => {
    try {
      let resp = await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Ready to write some NFC tags!',
      });
      console.warn(resp);
      let ndef = await NfcManager.getNdefMessage();
      console.warn(ndef);
      let bytes = buildUrlPayload('https://www.gazette.ncnu.edu.tw/');
      await NfcManager.writeNdefMessage(bytes);
      console.warn('success');
      await NfcManager.setAlertMessageIOS('I got your tag!');
      cleanUp();
    } catch (ex) {
      console.warn('ex', ex);
      cleanUp();
    }
  };

  // Reader Component
  const Read = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>測試 NFC Reader 功能</Text>
        <Text style={styles.whitetext}>
          是否支援NFC?{'  '}
          <Text
            style={{
              backgroundColor: support ? 'green' : 'red',
              color: 'white',
            }}>
            {support ? '支援' : '不支援'}
          </Text>
        </Text>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.button}>
          <Text onPress={() => read()} style={styles.buttonText}>
            測試讀取
          </Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.button}>
          <Text onPress={() => cancel()} style={styles.buttonText}>
            取消測試
          </Text>
        </TouchableOpacity>
        <Text style={styles.id}>💳 tagID : {info.id}</Text>
        <Text style={styles.tagInfo}>💳 資料 : {tagInfo}</Text>
      </View>
    );
  };

  // Writer Component
  const Write = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>測試 NFC Writer 功能</Text>
        <Text style={styles.whitetext}>
          是否支援NFC?{'  '}
          <Text
            style={{
              backgroundColor: support ? 'green' : 'red',
              color: 'white',
              padding: 100,
            }}>
            {support ? '支援' : '不支援'}
          </Text>
        </Text>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.button}>
          <Text onPress={() => write()} style={styles.buttonText}>
            測試寫入
          </Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.button}>
          <Text onPress={() => cleanUp()} style={styles.buttonText}>
            取消測試
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const Tab = createBottomTabNavigator();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Read"
        tabBarOptions={{
          activeTintColor: '#38abe0',
          inactiveTintColor: '#909090',
          inactiveBackgroundColor: '#212121',
          activeBackgroundColor: '#212121',
        }}>
        <Tab.Screen
          name="Read"
          component={Read}
          options={{
            tabBarLabel: 'Reader',
            tabBarIcon: ({color, size}) => (
              <Icon name="smart-card-reader-outline" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Write"
          component={Write}
          options={{
            tabBarLabel: 'Writer',
            tabBarIcon: ({color, size}) => (
              <Icon name="cellphone-nfc" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
