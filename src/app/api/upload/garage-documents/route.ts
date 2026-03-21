import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Configuration des types de fichiers autorisés
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const agreementDocument = formData.get('agreementDocument') as File | null;
    const shopPhoto = formData.get('shopPhoto') as File | null;
    const idDocument = formData.get('idDocument') as File | null;

    // Validation des fichiers
    const files = [
      { name: 'agreementDocument', file: agreementDocument },
      { name: 'shopPhoto', file: shopPhoto },
      { name: 'idDocument', file: idDocument },
    ];

    for (const { name, file } of files) {
      if (!file) {
        return NextResponse.json(
          { error: `Le fichier ${name} est requis` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé pour ${name}. Utilisez JPG, PNG ou WebP.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Le fichier ${name} est trop volumineux. Maximum 10MB.` },
          { status: 400 }
        );
      }
    }

    // Créer le dossier d'upload s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'garage-documents');
    await mkdir(uploadDir, { recursive: true });

    // Générer des noms de fichiers uniques
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);

    const uploadFile = async (file: File, prefix: string): Promise<string> => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${prefix}_${timestamp}_${randomSuffix}.${extension}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      return `/uploads/garage-documents/${fileName}`;
    };

    // Upload des fichiers
    const agreementDocumentUrl = await uploadFile(agreementDocument!, 'agreement');
    const shopPhotoUrl = await uploadFile(shopPhoto!, 'shop');
    const idDocumentUrl = await uploadFile(idDocument!, 'id');

    return NextResponse.json({
      success: true,
      agreementDocumentUrl,
      shopPhotoUrl,
      idDocumentUrl,
    });

  } catch (error: any) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'upload des documents' },
      { status: 500 }
    );
  }
}
