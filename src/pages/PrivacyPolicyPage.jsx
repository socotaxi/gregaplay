import React from 'react';
import MainLayout from '../components/layout/MainLayout';

const PrivacyPolicyPage = () => (
  <MainLayout>
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Politique de confidentialité</h1>
      <p className="text-gray-700 mb-4">Dernière mise à jour : 02/07/2025</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">🔐 Introduction</h2>
      <p className="text-gray-700 mb-4">
        Chez <strong>Grega Play</strong>, votre vie privée est importante. Voici comment nous collectons, utilisons et protégeons vos données.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">📥 1. Quelles données sont collectées ?</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4">
        <li>Nom, prénom et e-mail à l’inscription ;</li>
        <li>Vidéos enregistrées via l’application ;</li>
        <li>Données techniques (appareil, navigateur, etc.).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">🧠 2. Pourquoi ces données ?</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4">
        <li>Créer et gérer votre compte ;</li>
        <li>Stocker et assembler vos vidéos ;</li>
        <li>Vous notifier de la réception des vidéos ou de la vidéo finale ;</li>
        <li>Améliorer l’expérience utilisateur.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">🗃️ 3. Où sont stockées vos données ?</h2>
      <p className="text-gray-700 mb-4">
        Vos données sont stockées sur <strong>Firebase (Google Cloud)</strong> et accessibles uniquement par notre équipe autorisée.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">👁️ 4. Qui peut voir vos vidéos ?</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4">
        <li>Seul le créateur de l’événement reçoit la vidéo finale ;</li>
        <li>Vos vidéos ne sont ni publiques, ni revendues, ni partagées sans autorisation.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">📤 5. Partage avec des tiers ?</h2>
      <p className="text-gray-700 mb-4">
        Nous ne partageons ni ne revendons vos données. Des outils comme Firebase ou Google Analytics peuvent traiter des données techniques pour améliorer le service.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">🧽 6. Suppression des données</h2>
      <p className="text-gray-700 mb-4">
        Vous pouvez demander la suppression de vos données à tout moment en nous contactant à <strong>contact@gregaplay.com</strong>.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">👶 7. Protection des mineurs</h2>
      <p className="text-gray-700 mb-4">
        L’application n’est pas destinée aux enfants de moins de 13 ans. Tout compte créé par un enfant sans autorisation parentale pourra être supprimé.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">⚙️ 8. Modifications</h2>
      <p className="text-gray-700 mb-4">
        Nous pouvons mettre à jour cette politique. Vous serez informé en cas de changement important.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">📬 9. Contact</h2>
      <p className="text-gray-700 mb-4">
        Pour toute question ou demande : <strong>contact@gregaplay.com</strong>
      </p>
    </div>
  </MainLayout>
);

export default PrivacyPolicyPage;
