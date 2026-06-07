// lib/upload.ts
'use client';

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadToFirebaseStorage(file: File, folder: string): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const path = `${folder}/${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}