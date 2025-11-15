'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PhotoUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('optimise cette photo pour un CV professionnel');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour uploader une photo');
      }

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('prompt', prompt);

      const response = await fetch('http://localhost:3001/api/user/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      setResult(data);
      console.log('✅ Photo uploadée avec succès:', data);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-8">Upload de Photo de Profil</h1>

      <div className="space-y-6">
        {/* Sélection du fichier */}
        <div className="space-y-2">
          <Label htmlFor="photo">Photo de profil</Label>
          <Input
            id="photo"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={loading}
          />
          <p className="text-sm text-gray-500">
            Formats acceptés: JPEG, PNG, WEBP (max 5MB)
          </p>
        </div>

        {/* Aperçu de l'image */}
        {preview && (
          <div className="space-y-2">
            <Label>Aperçu</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={preview}
                alt="Aperçu"
                className="max-w-xs mx-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        )}

        {/* Prompt personnalisé */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Instructions de traitement (optionnel)</Label>
          <Input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: optimise cette photo pour un CV professionnel"
            disabled={loading}
          />
          <p className="text-sm text-gray-500">
            Ces instructions seront envoyées au workflow n8n pour traiter l'image
          </p>
        </div>

        {/* Bouton d'upload */}
        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement en cours...
            </>
          ) : (
            '📸 Uploader et traiter la photo'
          )}
        </Button>

        {/* Affichage des erreurs */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}

        {/* Affichage du résultat */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ {result.message}</p>
              {result.warning && (
                <p className="text-orange-600 mt-2">⚠️ {result.warning}</p>
              )}
            </div>

            {result.photo && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <h3 className="font-semibold mb-3">Détails de la photo</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Nom original:</dt>
                    <dd className="font-mono text-xs">{result.photo.originalName}</dd>
                  </div>
                  {result.photo.processedFilename && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Fichier traité:</dt>
                        <dd className="font-mono text-xs">{result.photo.processedFilename}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Temps de traitement:</dt>
                        <dd>{result.photo.processingTime}s</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Taille:</dt>
                    <dd>{(result.photo.size / 1024).toFixed(2)} Ko</dd>
                  </div>
                  {result.photo.prompt && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Prompt utilisé:</dt>
                      <dd className="text-right max-w-xs">{result.photo.prompt}</dd>
                    </div>
                  )}
                </dl>

                {/* Afficher l'image traitée */}
                {result.photo.photoUrl && (
                  <div className="mt-4">
                    <Label>Image traitée</Label>
                    <img
                      src={`http://localhost:3001${result.photo.photoUrl}`}
                      alt="Photo traitée"
                      className="mt-2 max-w-xs mx-auto rounded-lg shadow-md border"
                      onError={(e) => {
                        console.error('Erreur de chargement de l\'image');
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Informations */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Comment ça marche ?</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Sélectionnez une image (JPEG, PNG ou WEBP)</li>
            <li>Personnalisez le prompt si nécessaire</li>
            <li>Cliquez sur "Uploader et traiter la photo"</li>
            <li>L'image est envoyée au workflow n8n qui l'optimise</li>
            <li>L'image traitée est enregistrée et associée à votre profil</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
