import AsyncStorage from '@react-native-async-storage/async-storage';

export async function writeFile(data: { [Name: string]: string }) {
  const jsonValue = JSON.stringify(data)
  await AsyncStorage.setItem('saveData', jsonValue)
}

export async function readFile(): Promise<{ [Name: string]: string }> {

  const value = await AsyncStorage.getItem('saveData');
  const data = value != null ? JSON.parse(value) : {}
  return data
}