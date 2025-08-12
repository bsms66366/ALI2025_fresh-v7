import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Pressable, TouchableOpacity, ScrollView, View, Text, SafeAreaView, Dimensions, Linking } from 'react-native';
import React, { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTheme } from '@/components/useTheme';

export default function ModalScreen() {
  const { theme, colorScheme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);
  
  // Theme cycling functionality
  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '⚙️';
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return 'System Theme';
    }
  };
  
  // Font size controls
  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };
  
  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  // Set background color to black regardless of theme
  const backgroundColor = '#000';
  const textColor = '#fff';
  const buttonBg = '#404040';

  // Get screen dimensions to ensure full width
  const { width: screenWidth } = Dimensions.get('window');

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor}]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          console.log('Navigating to tabs');
          router.replace('/(tabs)');
        }}
      >
        <FontAwesome name="hand-o-left" size={24} color="#bcba40" />
        <Text style={styles.backButtonText}>Back to Home</Text> 
      </TouchableOpacity>
      
      {/* Theme Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.themeButton, { backgroundColor: buttonBg }]}
          onPress={cycleTheme}
        >
          <Text style={[styles.buttonText, { color: textColor }]}>
            {getThemeIcon()} {getThemeText()}
          </Text>
        </Pressable>
      </View>
      
      {/* Font Size Controls */}
      <View style={styles.fontSizeControlContainer}>
        <TouchableOpacity onPress={decreaseFontSize} style={styles.fontSizeButton}>
          <Text style={styles.fontSizeButtonText}>A-</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={increaseFontSize} style={styles.fontSizeButton}>
          <Text style={styles.fontSizeButtonText}>A+</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>About ALI</Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            ALI (the Anatomy Learning Interface) was created by Brighton and Sussex Medical School to assist students with their learning of anatomy.
          </Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            It is a bespoke interface for handheld devices that compiles access to multifarious digital anatomy resources into one clear and secure gateway for use at the dissection table, within global human dissection laboratories.
          </Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            It enables both institutional and commercial products to be presented to students in a 'friendly and clear' manner in a way that is also mindful of the Human Tissue Authority requirements.
          </Text>
          
          <TouchableOpacity 
            style={styles.supportLink} 
            onPress={() => Linking.openURL('https://www.bsms.ac.uk/about/tel/index.aspx')}
          >
            <Text style={[styles.supportLinkText, { fontSize, lineHeight: fontSize * 1.5 }]}>
              For Support please contact: BSMS Professional Services
            </Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Privacy Notice</Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            The App automatically collects certain information when you visit, use or navigate the App. 
            This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, 
            and information about who and when you use our App.
          </Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            The App will collect data to facilitate log in, monitor performance of the app and to request feedback on the app so that we can fix faults and improve the experience. 
            We may also use your information as part of our efforts to keep our App safe and secure.
          </Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            If you are unsatisfied with the way Brighton and Sussex Medical School has processed your personal data, or have any questions or concerns about your data 
            please contact: dataprotection@brighton.ac.uk/dpo@sussex.ac.uk
          </Text>
          <Text style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.5 }]}>
            If we are not able to resolve the issue to your satisfaction, you have the right to apply to the Information Commissioner's Office (ICO). They can be contacted at: https://ico.org.uk/
          </Text>
          <TouchableOpacity 
            style={styles.supportLink} 
            onPress={() => Linking.openURL('https://universityofsussex.eu.qualtrics.com/jfe/form/SV_egtaH07LwYrxuvP')}
          >
            <Text style={[styles.supportLinkText, { fontSize, lineHeight: fontSize * 1.5 }]}>
             Feedback form 
            </Text>
          </TouchableOpacity>
          {/* Support contact information already added above */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  themeButton: {
    padding: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 15,
    minWidth: 180,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollContent: {
    padding: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bcba40',
    marginVertical: 10,
    textAlign: 'center',
  },
  contentText: {
    color: '#bcba40',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
  },
  fontSizeControlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  fontSizeButton: {
    backgroundColor: '#bcba40',
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  fontSizeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  supportLink: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#bcba40',
    alignSelf: 'center',
    alignItems: 'center',
  },
  supportLinkText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
    marginLeft: 10,
  },
  backButtonText: {
    color: '#bcba40',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});
