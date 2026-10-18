import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwuR_YnHLeikl1HE6KsveXjZVy8xSwdsw",
  authDomain: "isb-portal.firebaseapp.com",
  projectId: "isb-portal",
  storageBucket: "isb-portal.firebasestorage.app",
  messagingSenderId: "440240262246",
  appId: "1:440240262246:web:0f314f7fa19cd8d0f8f1a7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyNisList = ['202401001', '202401002', '202401003', '202401004'];
const dummyNames = ['muhammad al-fatih', 'abdullah bin umar', 'hamzah bin hendra', 'ahmad fauzi'];
const dummyParents = ['h. bambang irawan', 'dr. hendra pratama', 'ust. salim maulana'];

async function cleanCollection(collectionName) {
  console.log(`Checking collection: ${collectionName}...`);
  const colRef = collection(db, collectionName);
  const snap = await getDocs(colRef);
  console.log(`Found ${snap.size} documents in ${collectionName}`);

  for (const d of snap.docs) {
    const data = d.data();
    
    // Check if it's dummy data
    const isDummySantri = 
      d.id.startsWith('santri-00') ||
      dummyNisList.includes(data.nis) ||
      (data.name && dummyNames.includes(data.name.toLowerCase())) ||
      (data.parentName && dummyParents.includes(data.parentName.toLowerCase())) ||
      data.parentToken === 'wali-fatih' ||
      data.parentToken === 'wali-hendra';

    if (collectionName === 'santri' && isDummySantri) {
      console.log(`Deleting dummy santri doc: ${d.id} (${data.name})`);
      await deleteDoc(doc(db, collectionName, d.id));
    } else if (collectionName === 'transactions' && (d.id.startsWith('trx-') || isDummySantri)) {
      console.log(`Deleting dummy transaction doc: ${d.id}`);
      await deleteDoc(doc(db, collectionName, d.id));
    } else if (collectionName === 'topups' && (d.id.startsWith('topup-') || isDummySantri)) {
      console.log(`Deleting dummy topup doc: ${d.id}`);
      await deleteDoc(doc(db, collectionName, d.id));
    } else if (collectionName === 'spp') {
      console.log(`Deleting dummy spp doc: ${d.id}`);
      await deleteDoc(doc(db, collectionName, d.id));
    }
  }
}

async function main() {
  try {
    // 1. Create a system placeholder so any old clients never trigger snapshot.empty auto-seeding
    await setDoc(doc(db, 'santri', '_system_init'), {
      isSystemPlaceholder: true,
      createdAt: new Date().toISOString()
    });

    await cleanCollection('santri');
    await cleanCollection('transactions');
    await cleanCollection('topups');
    await cleanCollection('spp');
    console.log('Finished cleaning Firestore collections!');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

main();
