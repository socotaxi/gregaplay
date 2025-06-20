import supabase from '../lib/supabaseClient';
import emailService from './emailService';

/**
 * Service for managing invitations with tokens and email workflow
 */
const invitationService = {
  /**
   * Generate a secure invitation token
   * @returns {Promise<string>} Generated token
   */
  async generateToken() {
    const { data, error } = await supabase.rpc('generate_invitation_token');
    
    if (error) {
      console.error('Error generating token:', error);
      // Fallback to client-side generation
      return this.generateClientToken();
    }
    
    return data;
  },

  /**
   * Fallback client-side token generation
   * @returns {string} Generated token
   */
  generateClientToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Create and send invitations for an event
   * @param {Object} invitationData - Invitation details
   * @returns {Promise<Object>} Results with success/failure details
   */
  async createAndSendInvitations(invitationData) {
    const {
      eventId,
      emails,
      eventTitle,
      eventDescription,
      eventTheme,
      eventDeadline,
      organizerName,
      personalMessage,
      invitedBy
    } = invitationData;

    try {
      console.log(`Creating invitations for event ${eventId} to ${emails.length} participants`);
      
      // Validate emails
      const validEmails = [];
      const invalidEmails = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      emails.forEach(email => {
        const trimmedEmail = email.trim().toLowerCase();
        if (emailRegex.test(trimmedEmail) && trimmedEmail.length <= 100) {
          validEmails.push(trimmedEmail);
        } else {
          invalidEmails.push(email);
        }
      });

      if (validEmails.length === 0) {
        return {
          success: false,
          error: 'Aucune adresse email valide trouvée',
          invalid: invalidEmails
        };
      }

      // Check for existing invitations
      const { data: existingInvitations, error: existingError } = await supabase
        .from('invitations')
        .select('email')
        .eq('event_id', eventId)
        .in('email', validEmails);

      if (existingError) {
        console.error('Error checking existing invitations:', existingError);
      }

      const existingEmails = existingInvitations ? existingInvitations.map(inv => inv.email) : [];
      const newEmails = validEmails.filter(email => !existingEmails.includes(email));

      if (newEmails.length === 0) {
        return {
          success: true,
          message: 'Tous les participants sont déjà invités',
          created: [],
          skipped: validEmails,
          invalid: invalidEmails
        };
      }

      // Create invitations with tokens
      const invitations = [];
      const emailsToSend = [];

      for (const email of newEmails) {
        try {
          const token = await this.generateToken();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

          invitations.push({
            event_id: eventId,
            email: email,
            token: token,
            status: 'pending',
            invited_by: invitedBy,
            message: personalMessage || null,
            expires_at: expiresAt.toISOString()
          });

          // Prepare email data
          const invitationLink = emailService.createInvitationLink(token);
          const emailSubject = emailService.generateEmailSubject(eventTitle, organizerName);
          const emailHtml = emailService.generateInvitationEmailTemplate({
            eventTitle,
            eventDescription,
            eventTheme,
            eventDeadline,
            organizerName,
            personalMessage,
            invitationLink
          });

          emailsToSend.push({
            to: email,
            subject: emailSubject,
            html: emailHtml,
            eventId: eventId,
            invitationToken: token
          });
        } catch (tokenError) {
          console.error(`Error generating token for ${email}:`, tokenError);
          invalidEmails.push(email);
        }
      }

      // Insert invitations into database
      console.log('🔍 DEBUG: About to insert invitations:', JSON.stringify(invitations, null, 2));
      console.log('🔍 DEBUG: Supabase client status:', !!supabase);
      
      // Test database connection first
      try {
        const { data: testData, error: testError } = await supabase
          .from('invitations')
          .select('count')
          .limit(1);
        console.log('🔍 DEBUG: Database connection test result:', { testData, testError });
      } catch (testException) {
        console.error('🔍 DEBUG: Database connection test exception:', testException);
      }
      
      const { data: createdInvitations, error: insertError } = await supabase
        .from('invitations')
        .insert(invitations)
        .select();

      console.log('🔍 DEBUG: Insert result:', { createdInvitations, insertError });
      console.log('🔍 DEBUG: Insert error details:', JSON.stringify(insertError, null, 2));

      if (insertError) {
        console.error('Error creating invitations:', insertError);
        console.error('Error code:', insertError.code);
        console.error('Error message:', insertError.message);
        console.error('Error details:', insertError.details);
        console.error('Error hint:', insertError.hint);
        const errorMessage = insertError?.message || insertError?.details || insertError?.hint || `Code: ${insertError?.code}` || 'Erreur inconnue';
        throw new Error(`Erreur lors de la création des invitations: ${errorMessage}`);
      }

      // Send emails
      const emailResults = await emailService.sendBulkInvitations(emailsToSend);

      return {
        success: true,
        created: createdInvitations,
        skipped: existingEmails,
        invalid: invalidEmails,
        emailResults: emailResults,
        message: `${createdInvitations.length} invitations créées et envoyées`
      };

    } catch (error) {
      console.error('Error in createAndSendInvitations:', error);
      // Provide more detailed error information
      if (error.message) {
        throw error;
      } else {
        throw new Error(`Erreur lors de la création des invitations: ${JSON.stringify(error)}`);
      }
    }
  },

  /**
   * Get invitation by token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Invitation details with event info
   */
  async getInvitationByToken(token) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          events (
            id,
            title,
            description,
            theme,
            deadline,
            status,
            user_id,
            profiles!events_user_id_fkey (
              full_name,
              email
            )
          )
        `)
        .eq('token', token)
        .single();

      if (error) {
        console.error('Error fetching invitation:', error);
        return null;
      }

      // Check if invitation is still valid
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (expiresAt < now && data.status === 'pending') {
        // Mark as expired
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('token', token);
        
        return { ...data, status: 'expired' };
      }

      return data;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      return null;
    }
  },

  /**
   * Accept an invitation
   * @param {string} token - Invitation token
   * @param {string} userId - User ID who is accepting
   * @returns {Promise<boolean>} Success status
   */
  async acceptInvitation(token, userId) {
    try {
      // Use the database function for atomic operation
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token,
        user_id: userId
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      return false;
    }
  },

  /**
   * Decline an invitation
   * @param {string} token - Invitation token
   * @returns {Promise<boolean>} Success status
   */
  async declineInvitation(token) {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ 
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('token', token);

      if (error) {
        console.error('Error declining invitation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in declineInvitation:', error);
      return false;
    }
  },

  /**
   * Get invitation statistics for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Invitation statistics
   */
  async getInvitationStats(eventId) {
    try {
      const { data, error } = await supabase
        .from('invitation_stats')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) {
        console.error('Error fetching invitation stats:', error);
        return {
          total_invitations: 0,
          pending_invitations: 0,
          accepted_invitations: 0,
          declined_invitations: 0,
          expired_invitations: 0
        };
      }

      return data;
    } catch (error) {
      console.error('Error in getInvitationStats:', error);
      return null;
    }
  },

  /**
   * Resend invitation email
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<boolean>} Success status
   */
  async resendInvitation(invitationId) {
    try {
      // Get invitation details
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select(`
          *,
          events (
            title,
            description,
            theme,
            deadline,
            profiles!events_user_id_fkey (
              full_name
            )
          )
        `)
        .eq('id', invitationId)
        .single();

      if (error || !invitation) {
        console.error('Invitation not found:', error);
        return false;
      }

      if (invitation.status !== 'pending') {
        console.log('Cannot resend non-pending invitation');
        return false;
      }

      // Prepare and send email
      const invitationLink = emailService.createInvitationLink(invitation.token);
      const emailSubject = emailService.generateEmailSubject(
        invitation.events.title,
        invitation.events.profiles.full_name
      );
      const emailHtml = emailService.generateInvitationEmailTemplate({
        eventTitle: invitation.events.title,
        eventDescription: invitation.events.description,
        eventTheme: invitation.events.theme,
        eventDeadline: invitation.events.deadline,
        organizerName: invitation.events.profiles.full_name,
        personalMessage: invitation.message,
        invitationLink
      });

      const success = await emailService.sendInvitationEmail({
        to: invitation.email,
        subject: emailSubject,
        html: emailHtml,
        eventId: invitation.event_id,
        invitationToken: invitation.token
      });

      return success;
    } catch (error) {
      console.error('Error resending invitation:', error);
      return false;
    }
  }
};

export default invitationService;