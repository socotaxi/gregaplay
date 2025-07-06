#!/bin/bash

# Étape 1 : Supprimer l'ancienne version globale installée via npm
echo "🔧 Suppression de Supabase CLI installé via npm (si présent)..."
npm uninstall -g supabase 2>/dev/null

# Étape 2 : Exécuter la commande Supabase en mode temporaire via pnpm
echo "🚀 Utilisation de Supabase CLI via pnpm dlx"

# Étape 3 : Désactiver la vérification JWT sur la fonction process-video
echo "🔓 Désactivation de la vérification JWT pour process-video..."
pnpm dlx supabase@latest functions set-verify-jwt process-video false

# Étape 4 : Redéployer la fonction
echo "📦 Déploiement de la fonction process-video..."
pnpm dlx supabase@latest functions deploy process-video

echo "✅ Script terminé !"
