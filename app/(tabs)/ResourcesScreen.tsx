import { StyleSheet, Text, View, Image, Pressable, ViewStyle, TextStyle, ImageStyle, Dimensions, TouchableOpacity, Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const createBoxBorderStyle = (height: number, width: number): ViewStyle => ({
    marginTop: 30,
    width: (width / 3) - 10,
    height: '40%',
    borderColor: '#bcba40',
    borderStyle: 'dotted',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
});

export default function ResourcesScreen() {
  const { height, width } = Dimensions.get('window');

  const handleStartScanning = async () => {
    try {
      // Clear any previous model URI
      await AsyncStorage.removeItem('currentModelUri');
      // Navigate to ModelFetchScreen which has the QR scanner
      router.push("/(resources)/ModelFetchScreen" as any);
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      // Navigate anyway
      router.push("/(resources)/ModelFetchScreen")as any;
    }
  };

  const openApp = async (appUrl: string, fallbackUrl: string, appName: string) => {
    try {
      // Try to open the app directly first
      await Linking.openURL(appUrl);
    } catch (error) {
      // If opening the app fails, then show the fallback options
      console.log(`${appName} not available, showing fallback options:`, error);
      Alert.alert(
        `${appName} Not Available`,
        `Would you like to open ${appName} in your browser instead?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open in Browser', onPress: () => WebBrowser.openBrowserAsync(fallbackUrl) }
        ]
      );
    }
  };

  const handleImaiosApp = async () => {
    Alert.alert(
      'IDV (IMAIOS) DICOM Viewer',
      'Choose how you want to access IDV:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Installed App', 
          onPress: () => {
            Alert.alert(
              'Open IDV App',
              'Please manually open the IDV app from your home screen. The app cannot be opened directly from this interface due to iOS security restrictions.',
              [{ text: 'OK' }]
            );
          }
        },
        { text: 'App Store', onPress: () => Linking.openURL('https://apps.apple.com/app/id1444841062') }
      ]
    );
  };

  const handleSlidoApp = async () => {
    // Try common Slido URL schemes first
    const slidoSchemes = ['slido://', 'com.slido.app://', 'sli.do://'];
    
    for (const scheme of slidoSchemes) {
      try {
        await Linking.openURL(scheme);
        return; // If successful, stop here
      } catch (error) {
        // Continue to next scheme
      }
    }
    
    // If all schemes fail, show dialog
    Alert.alert(
      'Slido Q&A',
      'Choose how you want to access Slido:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Installed App', 
          onPress: () => {
            Alert.alert(
              'Open Slido App',
              'Please manually open the Slido app from your home screen. The app cannot be opened directly from this interface due to iOS security restrictions.',
              [{ text: 'OK' }]
            );
          }
        },
        { text: 'App Store', onPress: () => Linking.openURL('https://apps.apple.com/app/id954596240') }
      ]
    );
  };

  const handleClinicalKeyApp = async () => {
    Alert.alert(
      'Clinical Key',
      'Choose how you want to access Clinical Key:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Installed App', 
          onPress: () => {
            Alert.alert(
              'Open Clinical Key App',
              'Please manually open the Clinical Key app from your home screen. The app cannot be opened directly from this interface due to iOS security restrictions.',
              [{ text: 'OK' }]
            );
          }
        },
        { text: 'App Store', onPress: () => Linking.openURL('https://apps.apple.com/app/id1041998175') }
      ]
    );
  };

  return (
    <View style={styles.v_container}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={handleClinicalKeyApp}>
            <Image source={require('@/assets/images/interfaceIcons_Artboard29.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>Clinical Key</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={() => router.push("/(resources)/PathPotsScreen" as any)}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard9.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>Pathology Pots</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://www.spatial.io/s/BSMS-Anatomy-Department-Metaverse-63f1222446f222d934f1f54c?share=4830808449733533739')}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard37.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>Anatomy Metaverse</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={handleStartScanning}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard39.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>AR Models</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://ali.brighton.domains/360Tour/index.html')}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard28.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>360 Lab Tour</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('http://microscopy.bsms.ac.uk')}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard40.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>Microscopy</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={handleSlidoApp}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard43.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}> Slido Q&A</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={() => openApp('completeanatomy://', 'https://3d4medical.com/complete-anatomy', 'Complete Anatomy')}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard42.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>Complete Anatomy</Text>
          </TouchableOpacity>
        </View>
        <View style={createBoxBorderStyle(height, width)}>
          <TouchableOpacity onPress={handleImaiosApp}>
            <Image source={require('../../assets/images/interfaceIcons_Artboard44.png')} style={styles.IconStyle} />
            <Text style={styles.titleText}>IDV (IMAIOS)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  IconStyle: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  v_container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 5,
    backgroundColor: '#000000',
  },
  titleText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bcba40',
    justifyContent: 'center',
    alignItems: 'center',
    //paddingLeft: 30,
    paddingBottom:20,
  },
});