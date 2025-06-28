import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import eventService from '../services/eventService';
import videoService from '../services/videoService';
import { useAuth } from '../context/AuthContext';

const FinalVideoPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [finalVideo, setFinalVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);

        // Check if final video exists
        if (eventData.status === 'done' && eventData.final_video_url) {
          setFinalVideo(eventData.final_video_url);
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

  const handleGenerateVideo = async () => {
    if (!event) return;

    try {
      setProcessing(true);
      await videoService.generateFinalVideo(eventId);
      
      // Refresh event data
      const updatedEvent = await eventService.getEvent(eventId);
      setEvent(updatedEvent);
      
      if (updatedEvent.final_video_url) {
        setFinalVideo(updatedEvent.final_video_url);
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError('Une erreur s\'est produite lors de la génération de la vidéo.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  const canStartProcessing = event &&
    (event.status === 'ready' || event.status === 'open') &&
    user &&
    (user.id === event.user_id || user.role === 'admin');

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              {event ? event.title : 'Vidéo finale'}
            </h1>
            {event && event.theme && (
              <p className="mt-1 text-sm text-gray-500">
                Thème: {event.theme}
              </p>
            )}
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
            {event && (event.status === 'open' || event.status === 'ready') && (
              <Link to={`/submit/${event.id}`}>
                <Button>
                  Soumettre une vidéo
                </Button>
              </Link>
            )}
            {event && user && user.id === event.user_id && (
              <Link to={`/events/${event.id}/participants`}>
                <Button variant="secondary">
                  Inviter des participants
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="secondary">
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Main content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {finalVideo ? (
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Vidéo finale</h3>
              <div className="mt-4 aspect-w-16 aspect-h-9">
                <video
                  controls
                  className="w-full h-auto rounded-md shadow-lg"
                  src={finalVideo}
                >
                  Votre navigateur ne prend pas en charge la lecture de vidéos.
                </video>
              </div>
              
              {/* Download button */}
              <div className="mt-5 flex justify-center">
                <a
                  href={finalVideo}
                  download={`${event.title.replace(/\s+/g, '_')}_final.mp4`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger la vidéo
                </a>
              </div>
            </div>
          ) : (
            <div className="px-4 py-5 sm:p-6">
              {event && event.status === 'processing' ? (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-indigo-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Montage en cours...</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Nous assemblons les vidéos. Cela peut prendre quelques minutes.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  {event && event.video_count === 0 ? (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Pas encore de vidéos</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Attendez que les participants soumettent leurs vidéos.
                      </p>
                    </>
                  ) : canStartProcessing ? (
                    <>
                      <svg className="mx-auto h-12 w-12 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Prêt pour le montage</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {event.video_count} vidéos ont été soumises. Vous pouvez maintenant générer la vidéo finale.
                      </p>
                      <div className="mt-5">
                        <Button
                          onClick={handleGenerateVideo}
                          loading={processing}
                          disabled={processing}
                        >
                          Générer la vidéo
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">En attente</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {event ? `${event.video_count} vidéos ont été soumises. En attente de la génération de la vidéo finale.` : 'Chargement des informations...'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event details */}
        {event && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Détails de l'événement</h2>
            <div className="mt-5 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.description || 'Aucune description'}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Date limite</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{new Date(event.deadline).toLocaleDateString('fr-FR')}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Nombre de vidéos</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.video_count || 0}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Statut</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${event.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                        event.status === 'done' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {event.status === 'open' ? 'Ouvert' :
                        event.status === 'ready' ? 'Prêt pour montage' :
                        event.status === 'processing' ? 'En traitement' :
                        event.status === 'done' ? 'Terminé' :
                        event.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default FinalVideoPage;