import supabase from '../lib/supabaseClient';

const videoService = {
  /**
   * Upload a video for an event
   * @param {File} file - The video file
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The uploaded video data
   */
  async uploadVideo(file, eventId, userId, participantName) {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `videos/${eventId}/${fileName}`;

    // Ensure the videos bucket exists before uploading
    try {
      const { data: bucket, error: bucketError } = await supabase.storage.getBucket('videos');
      if (bucketError && bucketError.status === 404) {
        await supabase.storage.createBucket('videos', { public: true });
      }
    } catch (bucketErr) {
      // Log but continue - upload will fail if bucket truly doesn't exist
      console.error('Error ensuring videos bucket:', bucketErr);
    }

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading video:', uploadError);
      throw new Error(uploadError.message);
    }

    // 2. Get public URL
    const { data: publicURL } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    // 3. Create database entry
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          participant_name: participantName || 'Anonymous',
          storage_path: filePath,
          status: 'ready',
          duration: 0, // This would be set after processing
        },
      ])
      .select();

    if (error) {
      console.error('Error creating video entry:', error);
      throw new Error(error.message);
    }

    return data[0];
  },

  /**
   * Get videos for an event
   * @param {string} eventId - The event ID
   * @returns {Promise<Array>} - The event videos
   */
  async getEventVideos(eventId) {
    const { data, error } = await supabase
      .from('videos')
      .select('*, profiles:profiles(*)')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event videos:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get final video for an event
   * @param {string} eventId - The event ID
   * @returns {Promise<string>} - The final video URL
   */
  async getFinalVideo(eventId) {
    const { data, error } = await supabase
      .from('events')
      .select('final_video_url')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching final video:', error);
      throw new Error(error.message);
    }

    if (!data.final_video_url) {
      throw new Error('Final video not available yet');
    }

    return data.final_video_url;
  },

  /**
   * Check if all videos have been submitted for an event
   * @param {string} eventId - The event ID
   * @returns {Promise<boolean>} - Whether all videos have been submitted
   */
  async checkAllVideosSubmitted(eventId) {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error checking event:', eventError);
      throw new Error(eventError.message);
    }
    
    // Get the count of invitations for this event
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('count')
      .eq('event_id', eventId);
      
    if (invitationsError) {
      console.error('Error checking invitations:', invitationsError);
      throw new Error(invitationsError.message);
    }
    
    const invitationCount = invitations.length > 0 ? parseInt(invitations[0].count) : 0;
    
    // Get the count of videos for this event
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('count')
      .eq('event_id', eventId);
      
    if (videosError) {
      console.error('Error checking videos:', videosError);
      throw new Error(videosError.message);
    }
    
    const videoCount = videos.length > 0 ? parseInt(videos[0].count) : 0;
    
    // Event is complete when all invitees have submitted videos
    return videoCount >= invitationCount;
  }
};

export default videoService;