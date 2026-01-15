import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut as firebaseSignOut, Auth, User as FirebaseUser } from "firebase/auth";
import { getFirestore, Firestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { FirebaseConfig } from "../types";

// --- CONFIGURAÇÃO REAL DO TUBEMASTER PLANNER ---
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyCl5m6o_dmDID5OdxhwAFrLhZSgLvrBKoc",
  authDomain: "tubemaster-planner.firebaseapp.com",
  projectId: "tubemaster-planner",
  storageBucket: "tubemaster-planner.firebasestorage.app",
  messagingSenderId: "976451292371",
  appId: "1:976451292371:web:ce0e733a4f46fa78751826"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Inicialização imediata (Singleton)
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Tenta login anônimo automático se não houver usuário persistido
    // Isso garante acesso ao Firestore mesmo sem "logar" explicitamente
    signInAnonymously(auth).catch((error) => {
        console.error("Erro no login anônimo:", error);
    });

    console.log("Firebase conectado com sucesso: TubeMaster");
  } catch (e) {
    console.error("Erro fatal ao iniciar Firebase", e);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

// Funções de verificação (mantidas para compatibilidade)
export const isFirebaseInitialized = () => true; 
export const getDb = () => db;
export const getAuthInstance = () => auth;

// --- AUTH ---
export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Firebase not initialized");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  await firebaseSignOut(auth);
  // Após logout, reconecta anonimamente para não perder acesso aos dados
  await signInAnonymously(auth);
};

// --- DATA HELPERS (REAL TIME) ---
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  if (!db) return () => {};
  
  const q = query(collection(db, collectionName));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
      console.error(`Erro ao ouvir coleção ${collectionName}:`, error);
  });
};

export const saveDocument = async (collectionName: string, data: any) => {
  if (!db) return;
  try {
    await setDoc(doc(db, collectionName, data.id), data, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar documento:", error);
    alert("Erro de permissão: Verifique se o Firestore está no 'Modo de Teste' no console do Firebase.");
  }
};

export const removeDocument = async (collectionName: string, id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
  }
};

export const initializeFirebase = (config: FirebaseConfig) => true; 
