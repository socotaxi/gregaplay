import React from 'react';
import Button from '../ui/Button';

const InvitationCard = ({ invitation, onAccept, onDecline, currentUser }) => {
  if (!invitation || !invitation.events) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 text-center">
        <p className="text-gray-500">Invitation non disponible</p>
      </div>
    );
  }

  const event = invitation.events;
  const organizer = event.profiles;
  const isExpired = invitation.status === 'expired' || new Date(invitation.expires_at) < new Date();
  const isDeclined = invitation.status === 'declined';
  const isAccepted = invitation.status === 'accepted';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (invitation.status) {
      case 'accepted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Acceptée</span>;
      case 'declined':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">❌ Déclinée</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">⏰ Expirée</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">📩 En attente</span>;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">🎬 {event.title}</h2>
          {getStatusBadge()}
        </div>
        <p className="text-indigo-100 mt-1">
          Organisé par {organizer?.full_name || organizer?.email || 'Utilisateur'}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Event Details */}
        <div className="space-y-4">
          {event.theme && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Thème</h3>
              <p className="mt-1 text-gray-900">{event.theme}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</h3>
            <p className="mt-1 text-gray-900">
              {event.description || 'Partagez vos plus beaux moments en vidéo pour créer un montage collaboratif !'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date limite</h3>
              <p className="mt-1 text-gray-900 font-semibold">
                📅 {formatDate(event.deadline)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Statut de l'événement</h3>
              <p className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.status === 'open' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.status === 'open' ? '🟢 Ouvert' : '🔴 Fermé'}
                </span>
              </p>
            </div>
          </div>

          {invitation.message && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <h3 className="text-sm font-medium text-blue-800">Message personnel</h3>
              <p className="mt-1 text-blue-700 italic">
                "{invitation.message}"
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">📝 Comment participer ?</h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Acceptez cette invitation</li>
            <li>2. {currentUser ? 'Connectez-vous à votre compte' : 'Créez votre compte Grega Play'}</li>
            <li>3. Téléchargez votre vidéo avant la date limite</li>
            <li>4. Regardez le montage final créé automatiquement !</li>
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        {isExpired ? (
          <div className="text-center">
            <p className="text-red-600 font-medium">⏰ Cette invitation a expiré</p>
            <p className="text-sm text-gray-500 mt-1">
              Contactez {organizer?.full_name || 'l\'organisateur'} pour obtenir une nouvelle invitation
            </p>
          </div>
        ) : isDeclined ? (
          <div className="text-center">
            <p className="text-gray-600 font-medium">❌ Vous avez décliné cette invitation</p>
          </div>
        ) : isAccepted ? (
          <div className="text-center space-y-3">
            <p className="text-green-600 font-medium">✅ Invitation acceptée !</p>
            <Button
              onClick={() => window.location.href = `/submit/${event.id}`}
              className="w-full"
            >
              🎥 Soumettre une vidéo
            </Button>
            <Button
              onClick={() => window.location.href = `/events/${event.id}`}
              className="w-full"
            >
              🎬 Aller à l'événement
            </Button>
          </div>
        ) : (
          <div className="flex space-x-3">
            <Button 
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              ✅ Accepter l'invitation
            </Button>
            <Button 
              onClick={onDecline}
              variant="secondary"
              className="flex-1"
            >
              ❌ Décliner
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-100 text-xs text-gray-500 text-center">
        Invitation envoyée le {formatDate(invitation.created_at)} • 
        Expire le {formatDate(invitation.expires_at)}
      </div>
    </div>
  );
};

export default InvitationCard;