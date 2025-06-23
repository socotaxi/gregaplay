import supabase from '../lib/supabaseClient';
import { toast } from 'react-toastify';
import invitationService from './invitationService';

const eventService = {
  /**
   * Create a new event
   * @param {Object} eventData - The event data
   * @returns {Promise<Object>} - The created event
   */
  async createEvent(eventData) {
    // Start global performance tracking
    const globalStart = performance.now();
    console.log('⏱️ EVENT CREATION STARTED at', new Date().toISOString());
    
    try {
      // Validate required fields with detailed feedback
      const requiredFields = ['title', 'userId', 'endDate'];
      const missingFields = requiredFields.filter(field => !eventData[field]);
      
      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        console.error('❌ VALIDATION ERROR:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Full debug logging
      console.log('📝 Creating event with data:', JSON.stringify(eventData, null, 2));
      
      // PHASE 1: DATABASE CONNECTIVITY CHECK (quick test)
      console.log('🔍 PHASE 1: Checking database connectivity');
      const pingStart = performance.now();
      try {
        const { error: pingError } = await supabase
          .from('events')
          .select('count')
          .limit(1);
          
        const pingDuration = performance.now() - pingStart;
        
        if (pingError) {
          console.error(`❌ Database connectivity test failed after ${Math.round(pingDuration)}ms:`, pingError);
        } else {
          console.log(`✅ Database connectivity verified in ${Math.round(pingDuration)}ms`);
        }
      } catch (pingError) {
        console.error('❌ CRITICAL: Database completely unreachable:', pingError);
      }
      
      // PHASE 2: TABLE SCHEMA CHECK
      console.log('🔍 PHASE 2: Checking events table structure');
      const schemaStart = performance.now();
      try {
        const { data: tableInfo, error: tableInfoError } = await supabase
          .from('events')
          .select('*')
          .limit(0);
          
        const schemaDuration = performance.now() - schemaStart;
        
        if (tableInfoError) {
          console.error(`❌ Events table schema check failed after ${Math.round(schemaDuration)}ms:`, tableInfoError);
          console.error('Error code:', tableInfoError.code);
          console.error('Error message:', tableInfoError.message);
          // Continue despite the error - we'll try the insert anyway
        } else {
          console.log(`✅ Events table structure verified in ${Math.round(schemaDuration)}ms`);
        }
      } catch (schemaError) {
        console.error('❌ CRITICAL: Could not verify events table schema:', schemaError);
        // Continue despite the error
      }
      
      // PHASE 3: EVENT CREATION
      console.log('🔍 PHASE 3: Creating event record');
      
      // Ultra-safe mapping of incoming data to database columns
      // Include defaults for everything to prevent null issues
      const eventToCreate = {
        title: eventData.title.substring(0, 255), // Prevent overly long titles
        theme: (eventData.theme || '').substring(0, 100),
        description: eventData.description || ' ', // Space as minimum to prevent null
        deadline: eventData.endDate,
        user_id: eventData.userId,
        status: 'open',
        max_videos: parseInt(eventData.maxVideos, 10) || 10
      };
      
      console.log('📝 Formatted event data:', JSON.stringify(eventToCreate, null, 2));
      
      // Create event with 3 retries
      let data = null;
      let lastError = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !data) {
        try {
          retryCount++;
          console.log(`🔄 Event creation attempt ${retryCount} of ${maxRetries}`);
          
          const insertStart = performance.now();
          const result = await supabase
            .from('events')
            .insert([eventToCreate])
            .select();
          const insertDuration = performance.now() - insertStart;
          
          if (result.error) {
            lastError = result.error;
            console.error(`❌ Insert attempt ${retryCount} failed after ${Math.round(insertDuration)}ms:`, result.error);
            
            if (retryCount < maxRetries) {
              // Wait before retrying to avoid hammering the database
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            }
          } else if (!result.data || result.data.length === 0) {
            lastError = new Error('No data returned from server');
            console.error(`❌ Insert attempt ${retryCount} returned no data after ${Math.round(insertDuration)}ms`); 
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            }
          } else {
            data = result.data[0];
            console.log(`✅ Event created successfully on attempt ${retryCount} in ${Math.round(insertDuration)}ms:`, data);
            break;
          }
        } catch (attemptError) {
          lastError = attemptError;
          console.error(`❌ Exception during insert attempt ${retryCount}:`, attemptError);
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
      }
      
      // If all attempts failed, throw the last error
      if (!data) {
        // Attempt to diagnose the issue
        console.error('❌ All event creation attempts failed. Diagnosing issue...');
        
        if (lastError?.code === '42P01') {
          throw new Error('La table events n\'existe pas. Veuillez exécuter le script SQL d\'initialisation.');
        } else if (lastError?.code === '23505') {
          throw new Error('Un événement avec ce titre existe déjà. Veuillez choisir un titre différent.');
        } else if (lastError?.message?.includes('description')) {
          throw new Error('Problème avec le champ description. Veuillez exécuter le script SQL pour ajouter cette colonne.');
        } else {
          throw new Error(`Création d'événement échouée: ${lastError?.message || 'Erreur inconnue'}`);
        }
      }
      
      // Report total execution time
      const globalDuration = performance.now() - globalStart;
      console.log(`⏱️ Total event creation time: ${Math.round(globalDuration)}ms`);
      return data;
    } catch (error) {
      const globalDuration = performance.now() - globalStart;
      console.error(`❌ EVENT CREATION FAILED after ${Math.round(globalDuration)}ms:`, error);
      throw error;
    }
  },

  /**
   * Get events created by a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - The user's events
   */
  async getUserEvents(userId) {
    const { data, error } = await supabase
      .from('events')
      .select('*, videos(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user events:', error);
      throw new Error(error.message);
    }

    return data.map(event => ({
      ...event,
      video_count: event.videos?.[0]?.count || 0
    }));
  },

  /**
   * Get an event by ID
   * @param {string} eventId - The event ID
   * @returns {Promise<Object>} - The event
   */
  async getEvent(eventId) {
    const { data, error } = await supabase
      .from('events')
      .select('*, videos(count)')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      video_count: data?.videos?.[0]?.count || 0
    };
  },

  /**
   * Get participants for an event
   * @param {string} eventId - The event ID
   * @returns {Promise<Array>} - The event participants
   */
  async getEventParticipants(eventId) {
    // First get the invitations for this event
    const { data: invitations, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('event_id', eventId);

    if (invitationError) {
      console.error('Error fetching event invitations:', invitationError);
      throw new Error(invitationError.message);
    }
    
    // Then get all videos submitted for this event
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('*, profiles:user_id(*)')
      .eq('event_id', eventId);
      
    if (videoError) {
      console.error('Error fetching event videos:', videoError);
      throw new Error(videoError.message);
    }
    
    // Combine the data to create a participant list
    // For each invitation, check if there's a matching video
    const participants = invitations.map(invitation => {
      const matchingVideo = videos.find(video => 
        (video.user_id && video.profiles && video.profiles.email === invitation.email) || 
        video.participant_name === invitation.email
      );
      
      return {
        email: invitation.email,
        status: invitation.status,
        has_submitted: !!matchingVideo,
        video: matchingVideo || null
      };
    });
    
    return participants;
  },

  /**
   * Update event status
   * @param {string} eventId - The event ID
   * @param {string} status - The new status
   * @returns {Promise<Object>} - The updated event
   */
  async updateEventStatus(eventId, status) {
    const { data, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', eventId)
      .select();

    if (error) {
      console.error('Error updating event status:', error);
      throw new Error(error.message);
    }

    return data[0];
  },

  /**
   * Send invitations to participants using the enhanced invitation system
   * @param {string} eventId - The event ID
   * @param {Array} emails - Array of email addresses
   * @param {Object} eventData - Event data for email content
   * @param {string} personalMessage - Optional personal message
   * @returns {Promise<Object>} Results with success/failure details
   */
  async sendInvitations(eventId, emails, eventData, personalMessage = null) {
    try {
      console.log(`Sending invitations for event ${eventId} to ${emails.length} participants`);
      
      // Get organizer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', eventData.userId || eventData.user_id)
        .single();
      
      if (profileError) {
        console.error('Error fetching organizer profile:', profileError);
      }
      
      const organizerName = profile?.full_name || profile?.email || 'Organisateur';
      
      // Use the enhanced invitation service
      const result = await invitationService.createAndSendInvitations({
        eventId,
        emails,
        eventTitle: eventData.title,
        eventDescription: eventData.description,
        eventTheme: eventData.theme,
        eventDeadline: eventData.deadline || eventData.endDate,
        organizerName,
        personalMessage,
        invitedBy: eventData.userId || eventData.user_id
      });
      
      // Show appropriate toast notifications
      if (result.success) {
        if (result.created && result.created.length > 0) {
          toast.success(`${result.created.length} invitation(s) envoyée(s) avec succès`);
        }
        
        if (result.skipped && result.skipped.length > 0) {
          toast.info(`${result.skipped.length} participant(s) déjà invité(s)`);
        }
        
        if (result.invalid && result.invalid.length > 0) {
          toast.warning(`${result.invalid.length} email(s) invalide(s) ignoré(s)`);
        }
        
        if (result.emailResults) {
          const { success, failed } = result.emailResults;
          if (failed.length > 0) {
            toast.error(`Erreur d'envoi pour ${failed.length} email(s)`);
          }
        }
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi des invitations');
      }
      
      return result;
      
    } catch (error) {
      console.error('Error in sendInvitations:', error);
      toast.error('Erreur lors de l\'envoi des invitations');
      throw error;
    }
  },

  /**
   * Check if a user has submitted a video for an event
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} - Whether the user has submitted a video
   */
  async hasSubmittedVideo(eventId, userId) {
    const { data, error } = await supabase
      .from('videos')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking video submission:', error);
      throw new Error(error.message);
    }

    return data.length > 0;
  },

  /**
   * Delete an event and all associated data
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID (for security check)
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async deleteEvent(eventId, userId) {
    try {
      console.log(`🗑️ Starting deletion of event ${eventId} by user ${userId}`);
      
      // First, verify the user owns this event
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('user_id')
        .eq('id', eventId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching event for deletion:', fetchError);
        throw new Error('Événement introuvable');
      }
      
      if (event.user_id !== userId) {
        throw new Error('Vous n\'avez pas le droit de supprimer cet événement');
      }
      
      // Delete related data in correct order (foreign key constraints)
      console.log('🗑️ Deleting related invitations...');
      const { error: invitationsError } = await supabase
        .from('invitations')
        .delete()
        .eq('event_id', eventId);
        
      if (invitationsError) {
        console.error('Error deleting invitations:', invitationsError);
        // Continue anyway - invitations table might not exist yet
      }
      
      console.log('🗑️ Deleting related videos...');
      const { error: videosError } = await supabase
        .from('videos')
        .delete()
        .eq('event_id', eventId);
        
      if (videosError) {
        console.error('Error deleting videos:', videosError);
        // Continue anyway
      }
      
      console.log('🗑️ Deleting related notifications...');
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('event_id', eventId);
        
      if (notificationsError) {
        console.error('Error deleting notifications:', notificationsError);
        // Continue anyway
      }
      
      // Finally, delete the event itself
      console.log('🗑️ Deleting event...');
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId); // Double security check
        
      if (eventError) {
        console.error('Error deleting event:', eventError);
        throw new Error(`Erreur lors de la suppression: ${eventError.message}`);
      }
      
      console.log('✅ Event deleted successfully');
      return true;
      
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
    }
  },

  /**
   * Delete an event and all associated data
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID (for security check)
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async deleteEvent(eventId, userId) {
    try {
      console.log(`🗑️ Starting deletion of event ${eventId} by user ${userId}`);
      
      // First, verify the user owns this event
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('user_id')
        .eq('id', eventId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching event for deletion:', fetchError);
        throw new Error('Événement introuvable');
      }
      
      if (event.user_id !== userId) {
        throw new Error('Vous n\'avez pas le droit de supprimer cet événement');
      }
      
      // Delete related data in correct order (foreign key constraints)
      console.log('🗑️ Deleting related invitations...');
      const { error: invitationsError } = await supabase
        .from('invitations')
        .delete()
        .eq('event_id', eventId);
        
      if (invitationsError) {
        console.error('Error deleting invitations:', invitationsError);
        // Continue anyway - invitations table might not exist yet
      }
      
      console.log('🗑️ Deleting related videos...');
      const { error: videosError } = await supabase
        .from('videos')
        .delete()
        .eq('event_id', eventId);
        
      if (videosError) {
        console.error('Error deleting videos:', videosError);
        // Continue anyway
      }
      
      console.log('🗑️ Deleting related notifications...');
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('event_id', eventId);
        
      if (notificationsError) {
        console.error('Error deleting notifications:', notificationsError);
        // Continue anyway
      }
      
      // Finally, delete the event itself
      console.log('🗑️ Deleting event...');
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId); // Double security check
        
      if (eventError) {
        console.error('Error deleting event:', eventError);
        throw new Error(`Erreur lors de la suppression: ${eventError.message}`);
      }
      
      console.log('✅ Event deleted successfully');
      toast.success('Événement supprimé avec succès');
      return true;
      
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
      throw error;
    }
  }
};

export default eventService;