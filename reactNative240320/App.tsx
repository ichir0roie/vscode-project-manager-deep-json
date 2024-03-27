/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from "react";
import type { PropsWithChildren } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from "react-native/Libraries/NewAppScreen";


import AsyncStorage from '@react-native-async-storage/async-storage';

import { readFile, writeFile } from "./module/testExplorer";

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({ children, title }: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === "dark";
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === "dark";

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  async function testSave(value: string) {
    try {
      await AsyncStorage.setItem('my-key', value);
    } catch (e) {
      // saving error
    }
  }

  async function testLoad() {
    try {
      const value = await AsyncStorage.getItem('my-key');
      console.log(value)
      if (value !== null) {
        setLoadText(value)
        // value previously stored
      }
    } catch (e) {
      // error reading value
    }
  }

  const [text, setText] = useState("")
  function onPress() {
    console.log(text)
    testSave(text)
  }
  const [loadText, setLoadText] = useState("")

  function onPressLoad() {
    testLoad()
  }

  async function onPressWriteFile() {
    await writeFile({
      "key": "testaaa"
    })
    const res = await readFile()
    const data = res["key"]
    console.dirxml(data)
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
      // barStyle={isDarkMode ? "light-content" : "dark-content"}
      // backgroundColor={backgroundStyle.backgroundColor}
      />

      <TextInput value={text} onChangeText={setText} style={styles.text} />
      <Pressable onPress={onPress}>
        <Text style={styles.button}>test button</Text>
      </Pressable>

      <TextInput value={loadText} style={styles.text} />

      <Pressable onPress={onPressLoad}>
        <Text style={styles.button}>load</Text>
      </Pressable>
      <Pressable onPress={onPressWriteFile}>
        <Text style={styles.button}>write file</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
  button: {
    color: "#000",
  },
  text: {
    color: "#000",
    backgroundColor: "#fff"
  }
});

export default App;
