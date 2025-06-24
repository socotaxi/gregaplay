import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import eventService from '../services/eventService';
import videoService from '../services/videoService';

const SubmitVideoPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [participantName, setParticipantName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);
        
        // Check if event is still open for submissions
        if (eventData.status !== 'open') {
          setError("Cet événement n'accepte plus de vidéos.");
        }
        
        // Check if event deadline has passed
        const endDate = new Date(eventData.deadline);
        if (endDate < new Date()) {
          setError('La date limite de cet événement est dépassée.');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Impossible de charger les détails de l\'événement.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Veuillez sélectionner un fichier vidéo.');
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!participantName.trim()) {
      setError('Veuillez entrer votre nom.');
      return;
    }
    
    if (!selectedFile) {
      setError('Veuillez sélectionner une vidéo à soumettre.');
      return;
    }
    
    setSubmitting(true);

    try {
      // Upload video without user
      await videoService.uploadVideo(selectedFile, eventId, null, participantName);
      
      // Show success message
      setSuccess(true);
    } catch (err) {
      console.error('Error uploading video:', err);
      setError(err.message || 'Une erreur s\'est produite lors de la soumission de votre vidéo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (success) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Merci pour votre vidéo!</h3>
              <div className="mt-3 text-sm text-gray-500">
                <p>Votre vidéo a été soumise avec succès. Elle sera incluse dans le montage final.</p>
              </div>
              <div className="mt-5">
                <Button
                  variant="secondary"
                  onClick={() => window.close()}
                >
                  Fermer cette page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              {event ? event.title : 'Soumettre une vidéo'}
            </h1>
            {event && event.theme && (
              <p className="mt-1 text-sm text-gray-500">
                Thème: {event.theme}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {event && event.description && (
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">À propos de cet événement</h3>
              <p className="mt-1 text-sm text-gray-500">{event.description}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6">
                <div>
                  <label htmlFor="participantName" className="block text-sm font-medium text-gray-700">
                    Votre nom
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="participantName"
                      id="participantName"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Entrez votre nom"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Votre vidéo
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="video-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Télécharger une vidéo</span>
                          <input
                            id="video-upload"
                            name="video-upload"
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">ou faites glisser et déposez</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        MP4, MOV, AVI jusqu'à 100MB
                      </p>
                    </div>
                  </div>
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aperçu de la vidéo
                    </label>
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-auto rounded-md"
                    >
                      Votre navigateur ne prend pas en charge la lecture de vidéos.
                    </video>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting || !!error}
              >
                Soumettre la vidéo
              </Button>
            </div>
          </form>
        </div>

        {event && event.max_clip_duration && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Durée maximale de la vidéo: {event.max_clip_duration} secondes</p>
            <p>Date limite de soumission: {new Date(event.deadline).toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SubmitVideoPage;