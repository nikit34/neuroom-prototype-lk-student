import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyC13Lv7Jc1QHnqaTW0_MGXaosSQiVBz5Lo',
  authDomain: 'neuroom-prototype-lk-stu-bc8ba.firebaseapp.com',
  databaseURL: 'https://neuroom-prototype-lk-stu-bc8ba-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'neuroom-prototype-lk-stu-bc8ba',
  storageBucket: 'neuroom-prototype-lk-stu-bc8ba.firebasestorage.app',
  messagingSenderId: '624058353273',
  appId: '1:624058353273:web:e4356a99c05fa1f30f36a8',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
