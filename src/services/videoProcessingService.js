import supabase from '../lib/supabaseClient';

const videoProcessingService = {
  /**
   * Déclenche le traitement vidéo pour un événement
   * @param {string} eventId - L'ID de l'événement
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async triggerVideoProcessing(eventId) {
    // 1. Mettre à jour le statut de l’événement
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'processing' })
      .eq('id', eventId);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut :', updateError);
      throw new Error(updateError.message);
    }

    try {
      // 2. Construire l’URL d’API adaptée à l’environnement
      const API_BASE_URL =
        import.meta.env.MODE === 'development'
          ? 'http://localhost:4000'
          : 'https://gregaplay.vercel.app'; // ← domaine de ton app Vercel

      const response = await fetch(`${API_BASE_URL}/api/process-video?eventId=${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Erreur serveur');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du déclenchement du traitement vidéo :', error);

      // 3. Revenir à "ready" si échec
      await supabase
        .from('events')
        .update({ status: 'ready' })
        .eq('id', eventId);

      throw new Error('Échec du traitement vidéo');
    }
  },

  /**
   * Vérifie le statut de traitement
   * @param {string} eventId
   * @returns {Promise<string>}
   */
  async checkProcessingStatus(eventId) {
    const { data, error } = await supabase
      .from('events')
      .select('status')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Erreur lors de la vérification du statut :', error);
      throw new Error(error.message);
    }

    return data.status;
  },

  /**
   * Définit l'URL finale de la vidéo dans la table events
   * @param {string} eventId
   * @param {string} videoUrl
   * @returns {Promise<Object>}
   */
  async setFinalVideoUrl(eventId, videoUrl) {
    const { data, error } = await supabase
      .from('events')
      .update({
        final_video_url: videoUrl,
        status: 'done'
      })
      .eq('id', eventId)
      .select();

    if (error) {
      console.error('Erreur lors de la mise à jour de la vidéo finale :', error);
      throw new Error(error.message);
    }

    return data[0];
  },

  /**
   * Vérifie que toutes les vidéos d'un événement sont validées
   * @param {string} eventId
   * @returns {Promise<boolean>}
   */
  async validateEventVideos(eventId) {
    const { data, error } = await supabase
      .from('videos')
      .select('status')
      .eq('event_id', eventId);

    if (error) {
      console.error('Erreur lors de la validation des vidéos :', error);
      throw new Error(error.message);
    }

    const invalidVideos = data.filter(video => video.status !== 'validated');
    return invalidVideos.length === 0;
  }
};

export default videoProcessingService;
