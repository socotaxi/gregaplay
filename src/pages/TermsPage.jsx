import React from 'react';
import MainLayout from '../components/layout/MainLayout';

const TermsPage = () => (
  <MainLayout>
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Conditions d'utilisation</h1>

      <p className="text-gray-700 mb-4">Dernière mise à jour : 02/07/2025</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. 👋 Bienvenue</h2>
      <p className="text-gray-700 mb-4">
        Grega Play vous permet de créer des vidéos collaboratives pour célébrer des moments avec vos proches.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. ✅ Utilisation du service</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4">
        <li>Créez un compte avec Google ou e-mail.</li>
        <li>Les invités doivent aussi s’inscrire pour participer.</li>
        <li>Chaque participant peut envoyer <strong>1 vidéo de 30 sec max</strong>.</li>
        <li>Une fois envoyée, <strong>la vidéo ne peut pas être modifiée</strong>.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. 📹 Vidéo finale</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4">
        <li>Le créateur de l’événement peut lancer le montage.</li>
        <li>Seul le créateur reçoit la vidéo finale (il peut la partager s’il veut).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. 🚫 Ce qui est interdit</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4">
        <li>Contenus choquants, violents ou illégaux.</li>
        <li>Usurpation d’identité.</li>
        <li>Atteinte à la vie privée d’autrui.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. 🔐 Données & vie privée</h2>
      <p className="text-gray-700 mb-4">
        Vos vidéos et informations sont stockées en sécurité. Aucune revente de données. Plus d’infos dans notre Politique de confidentialité.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. 📦 Abonnements</h2>
      <p className="text-gray-700 mb-4">
        Le nombre de vidéos par événement dépend de votre formule (4, 10 ou illimité).
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. ❌ Suspension</h2>
      <p className="text-gray-700 mb-4">
        Nous pouvons suspendre un compte en cas d’abus ou de non-respect de ces règles.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. 🛠️ Mises à jour</h2>
      <p className="text-gray-700 mb-4">
        Ces conditions peuvent évoluer. Vous serez informé si cela concerne des changements importants.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. 📬 Contact</h2>
      <p className="text-gray-700 mb-4">
        Une question ? Contactez-nous à : <span className="font-medium">contact@gregaplay.com</span>
      </p>
    </div>
  </MainLayout>
);

export default TermsPage;
