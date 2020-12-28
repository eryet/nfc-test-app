/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  TextInput,
  StyleSheet,
  Settings,
  Linking,
  Platform,
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
  separator2: {
    marginVertical: 5,
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
    marginTop: 20,
  },
  tagInfo: {
    color: 'white',
    fontSize: 22,
    marginTop: 20,
  },
  labelmarginright: {
    marginRight: 15,
    color: 'white',
    fontSize: 16,
  },
});

// Writer Component
const Write = () => {
  const [info, setInfo] = useState({
    id: '空',
  });
  const [support, isSupported] = useState(true);
  const [urlToWrite, setUrlToWrite] = useState('');
  const [rtdtype, setRtdtype] = useState(RtdType.URL);
  const [writing, setWriting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    NfcManager.isSupported().then(supported => {
      isSupported(supported);
      if (supported) {
        startNfc();
      }
    });
    // to listen to the discovered tags and the NdefMessage within them
    NfcManager.setEventListener(NfcEvents.DiscoverTag, tag => {
      console.warn(tag);
      setInfo(tag);
      setLoading(false);
      NfcManager.setAlertMessageIOS('I got your tag!');
      NfcManager.unregisterTagEvent().catch(error => {
        console.warn('unregisterTagEvent fail', error);
      });
    });
    return cleanUp;
  });

  const read = async () => {
    try {
      NfcManager.registerTagEvent()
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

  const startNfc = () => {
    NfcManager.start({
      onSessionClosedIOS: () => {
        console.log('ios session closed');
      },
    })
      .then(result => {
        console.log('start OK', result);
      })
      .catch(error => {
        console.warn('start fail', error);
        // this.setState({supported: false});
      });

    if (Platform.OS === 'android') {
      // NfcManager.getLaunchTagEvent()
      //     .then(tag => {
      //         console.log('launch tag', tag);
      //         if (tag) {
      //             // save information from tag
      //             // tag is object
      //             setTag(tag)
      //         }
      //     })
      //     .catch(err => {
      //         console.log(err);
      //     })
      NfcManager.isEnabled()
        .then(enable => {
          setEnabled(enable);
        })
        .catch(err => {
          console.log(err);
        });
      NfcManager.onStateChanged(event => {
        if (event.state === 'on') {
          setEnabled(true);
        } else if (event.state === 'off') {
          setEnabled(false);
        }
      }).catch(err => {
        console.warn(err);
      });
    }
  };

  const buildUrlPayload = value => {
    return Ndef.encodeMessage([Ndef.uriRecord(value)]);
  };

  const buildTextPayload = value => {
    return Ndef.encodeMessage([Ndef.textRecord(value)]);
  };

  const cancelNdefWrite = () => {
    setWriting(false);
    NfcManager.cancelNdefWrite()
      .then(() => console.log('write cancelled'))
      .catch(err => console.warn(err));
  };

  const requestNdefWrite = () => {
    if (writing) {
      return;
    }

    let bytes;

    if (rtdtype === RtdType.URL) {
      bytes = buildUrlPayload(urlToWrite);
    } else if (rtdtype === RtdType.TEXT) {
      bytes = buildTextPayload(urlToWrite);
    }

    setWriting(true);
    NfcManager.requestNdefWrite(bytes)
      .then(() => console.log('write completed'))
      .catch(err => console.warn(err))
      .then(() => setWriting(false));
  };

  const requestFormat = () => {
    if (writing) {
      return;
    }

    setWriting(true);
    NfcManager.requestNdefWrite(null, {format: true})
      .then(() => console.log('format completed'))
      .catch(err => console.warn(err))
      .then(() => setWriting(false));
  };

  const cleanUp = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  };

  // not using it, basically without input with fixed url writen to tag
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>測試 NFC Writer 功能</Text>
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
      <View style={styles.separator2} />
      <Text style={styles.whitetext}>
        是否開啟NFC?{'  '}
        <Text
          style={{
            backgroundColor: enabled ? 'green' : 'red',
            color: 'white',
          }}>
          {enabled ? '開啟' : '未開啟'}
        </Text>
      </Text>
      <View style={styles.separator} />
      <View style={{flexDirection: 'row'}}>
        <Text style={styles.labelmarginright}>類別:</Text>
        {Object.keys(RtdType).map(key => (
          <TouchableOpacity
            key={key}
            style={{marginRight: 10}}
            onPress={() => setRtdtype(RtdType[key])}>
            <Text
              style={{
                color: rtdtype === RtdType[key] ? 'yellow' : 'white',
                fontSize: 16,
              }}>
              {key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.separator2} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        }}>
        <Text style={styles.labelmarginright}>輸入:</Text>
        <TextInput
          style={{width: 200, height: 40, backgroundColor: 'white'}}
          value={urlToWrite}
          onChangeText={text => setUrlToWrite(text)}
        />
      </View>
      <View style={styles.separator} />
      <TouchableOpacity style={styles.button} onPress={() => read()}>
        <Text style={styles.buttonText}>先讀取</Text>
      </TouchableOpacity>
      <View style={styles.separator} />
      <TouchableOpacity
        style={styles.button}
        onPress={() => (writing ? cancelNdefWrite() : requestNdefWrite())}>
        <Text style={styles.buttonText}>{`${
          writing ? '取消' : '測試寫入'
        }`}</Text>
      </TouchableOpacity>
      <View style={styles.separator} />

      <TouchableOpacity
        style={styles.button}
        onPress={() => (writing ? cancelNdefWrite() : requestFormat())}>
        <Text style={styles.buttonText}>{`${
          writing ? '取消' : '格式化'
        }`}</Text>
      </TouchableOpacity>
    </View>
  );
};

const App = () => {
  const [info, setInfo] = useState({
    id: '空',
  });
  const [justwrite, setJustWriting] = useState('');
  const [support, isSupported] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tagInfo, setTagInfo] = useState('無');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    NfcManager.isSupported().then(supported => {
      isSupported(supported);
      if (supported) {
        startNfc();
      }
    });
    // to listen to the discovered tags and the NdefMessage within them
    NfcManager.setEventListener(NfcEvents.DiscoverTag, tag => {
      console.warn(tag);
      setInfo(tag);
      setLoading(false);
      NfcManager.setAlertMessageIOS('I got your tag!');
      NfcManager.unregisterTagEvent().catch(error => {
        console.warn('unregisterTagEvent fail', error);
      });
    });
    return cleanUp;
  });

  const goToNfcSetting = () => {
    if (Platform.OS === 'android') {
      NfcManager.goToNfcSetting()
        .then(result => {
          console.log('goToNfcSetting OK', result);
        })
        .catch(error => {
          console.warn('goToNfcSetting fail', error);
        });
    }
  };

  const startNfc = () => {
    NfcManager.start({
      onSessionClosedIOS: () => {
        console.log('ios session closed');
      },
    })
      .then(result => {
        console.log('start OK', result);
      })
      .catch(error => {
        console.warn('start fail', error);
        // this.setState({supported: false});
      });

    if (Platform.OS === 'android') {
      // NfcManager.getLaunchTagEvent()
      //     .then(tag => {
      //         console.log('launch tag', tag);
      //         if (tag) {
      //             // save information from tag
      //             // tag is object
      //             setTag(tag)
      //         }
      //     })
      //     .catch(err => {
      //         console.log(err);
      //     })
      NfcManager.isEnabled()
        .then(enable => {
          setEnabled(enable);
        })
        .catch(err => {
          console.log(err);
        });
      NfcManager.onStateChanged(event => {
        if (event.state === 'on') {
          setEnabled(true);
        } else if (event.state === 'off') {
          setEnabled(false);
        }
      }).catch(err => {
        console.warn(err);
      });
    }
  };

  const cleanUp = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  };

  const cancel = () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.unregisterTagEvent()
      .then(result => {
        console.log('unregisterTagEvent OK', result);
      })
      .catch(error => {
        console.warn('unregisterTagEvent fail', error);
      });
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
        <View style={styles.separator2} />
        <Text style={styles.whitetext}>
          是否開啟NFC?{'  '}
          <Text
            style={{
              backgroundColor: enabled ? 'green' : 'red',
              color: 'white',
            }}>
            {enabled ? '開啟' : '未開啟'}
          </Text>
        </Text>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.button} onPress={() => read()}>
          <Text style={styles.buttonText}>測試讀取</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.button} onPress={() => cancel()}>
          <Text style={styles.buttonText}>取消測試</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.button}
          onPress={() => goToNfcSetting()}>
          <Text style={styles.buttonText}>到手機NFC設定</Text>
        </TouchableOpacity>
        <Text style={styles.id}>💳 tagID : {info.id}</Text>
        <Text style={styles.tagInfo}>💳 資料 : {tagInfo}</Text>
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
          keyboardHidesTabBar: true,
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
