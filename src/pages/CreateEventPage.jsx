import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';

// Memoized participants list component for better performance
const ParticipantsList = memo(({ participants, onRemove }) => {
  return (
    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
      <ul className="divide-y divide-gray-200">
        {participants.map((email) => (
          <li key={email} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
            <span className="text-sm text-gray-700">{email}</span>
            <button
              type="button"
              onClick={() => onRemove(email)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: '',
    startDate: '',
    endDate: '',
    videoDuration: 60, // Default final video duration in seconds
    maxClipDuration: 10, // Default max clip duration in seconds
    participants: []
  });
  const [participantEmail, setParticipantEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Memoized email validation function with enhanced checks
  const validateEmail = useCallback((email) => {
    if (!email.trim()) {
      return { valid: false, message: 'Veuillez entrer un email' };
    }
    
    const trimmedEmail = email.trim();
    
    // Check length
    if (trimmedEmail.length > 100) {
      return { valid: false, message: 'L\'adresse email est trop longue (max 100 caractères)' };
    }
    
    // Enhanced email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, message: 'Format d\'email invalide. Exemple: nom@domaine.com' };
    }
    
    // Check for common invalid patterns
    if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      return { valid: false, message: 'Format d\'email invalide (points consécutifs ou en début/fin)' };
    }
    
    // Check domain part
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2 || parts[1].length < 3 || !parts[1].includes('.')) {
      return { valid: false, message: 'Domaine email invalide' };
    }
    
    return { valid: true };
  }, []);

  const handleAddParticipant = useCallback(() => {
    // Reset error state
    setError(null);
    
    // Validate email
    const validation = validateEmail(participantEmail);
    if (!validation.valid) {
      toast.warning(validation.message);
      setError(validation.message);
      return;
    }

    const trimmedEmail = participantEmail.trim();

    // Check if email already in participants list (case insensitive)
    if (formData.participants.some(p => p.toLowerCase() === trimmedEmail.toLowerCase())) {
      const message = 'Ce participant est déjà dans la liste.';
      toast.warning(message);
      setError(message);
      return;
    }

    // Add participant using functional update to avoid stale state
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, trimmedEmail]
    }));
    
    setParticipantEmail('');
    
    // Show success message
    toast.success(`Participant ${trimmedEmail} ajouté`);
  }, [formData.participants, participantEmail, validateEmail]);

  const handleRemoveParticipant = useCallback((email) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
    toast.info(`Participant ${email} retiré`);
  }, []);

  // Validate form data - memoized to prevent unnecessary recalculation
  const validateForm = useCallback(() => {
    if (!formData.title.trim()) {
      return { valid: false, message: 'Le titre est requis.' };
    }
    
    if (!formData.endDate) {
      return { valid: false, message: 'La date limite est requise.' };
    }
    
    if (new Date(formData.endDate) < new Date()) {
      return { valid: false, message: 'La date limite doit être dans le futur.' };
    }
    
    if (formData.participants.length === 0) {
      return { valid: false, message: 'Veuillez ajouter au moins un participant.' };
    }
    
    return { valid: true };
  }, [formData.title, formData.endDate, formData.participants]);
  
  // Batch processing for participants to handle large lists more efficiently
  const processParticipantsInBatches = useCallback(async (eventId, emails, eventData, batchSize = 5) => {
    try {
      console.log(`Processing ${emails.length} participants for event ${eventId}`);
      
      // Create smaller batches for better error handling and progress tracking
      const batches = [];
      for (let i = 0; i < emails.length; i += batchSize) {
        batches.push(emails.slice(i, i + batchSize));
      }
      
      console.log(`Created ${batches.length} batches for processing`);
      
      // Tracking variables for progress
      let completedBatches = 0;
      let lastProgressReport = 0;
      
      // Process batches with a defer pattern to keep UI responsive
      return new Promise((resolve) => {
        function processBatch(index) {
          if (index >= batches.length) {
            console.log('All participant batches processed');
            resolve();
            return;
          }
          
          const batch = batches[index];
          console.log(`Processing batch ${index + 1}/${batches.length} with ${batch.length} emails`);
          
          // Use setTimeout to defer execution and keep UI responsive
          setTimeout(async () => {
            try {
              const result = await eventService.sendInvitations(eventId, batch, eventData, null);
              completedBatches++;
              
              // Handle the detailed response
              if (result.success) {
                if (result.invalid && result.invalid.length > 0) {
                  toast.warning(`Emails invalides ignorés: ${result.invalid.join(', ')}`);
                }
                if (result.skipped && result.skipped.length > 0) {
                  toast.info(`${result.skipped.length} participant(s) déjà invité(s)`);
                }
                if (result.created && result.created.length > 0) {
                  toast.success(`${result.created.length} invitation(s) envoyée(s)`);
                }
              }
              
              // Only show progress update at 25%, 50%, 75%, 100% to avoid too many toasts
              const currentProgress = Math.round((completedBatches / batches.length) * 100);
              if (batches.length > 1 && (currentProgress >= lastProgressReport + 25 || completedBatches === batches.length)) {
                toast.info(`Envoi des invitations: ${currentProgress}%`);
                lastProgressReport = Math.floor(currentProgress / 25) * 25;
              }
              
              // Continue with next batch
              processBatch(index + 1);
            } catch (batchError) {
              console.error(`Error processing batch ${index + 1}:`, batchError);
              
              // Provide specific error message
              const errorMessage = batchError.message || 'Erreur inconnue';
              if (errorMessage.includes('email valide')) {
                toast.error(`Emails invalides dans le lot ${index + 1}: ${errorMessage}`);
              } else if (errorMessage.includes('déjà invités')) {
                toast.warning(`Participants déjà invités dans le lot ${index + 1}`);
              } else if (errorMessage.includes('Table invitations')) {
                toast.error('Base de données non configurée. Contactez l\'administrateur.');
              } else {
                toast.error(`Erreur lot ${index + 1}: ${errorMessage}`);
              }
              
              // Continue with next batch despite error
              processBatch(index + 1);
            }
          }, 100); // Small delay to keep UI responsive
        }
        
        // Start processing with the first batch
        processBatch(0);
      });
    } catch (error) {
      console.error('Error in processParticipantsInBatches:', error);
      throw error;
    }
  }, []);

  // Keep form data in local storage to prevent loss
  const saveFormToStorage = useCallback(() => {
    try {
      localStorage.setItem('eventFormData', JSON.stringify(formData));
      console.log('Form data saved to local storage');
    } catch (e) {
      console.error('Failed to save form data to local storage:', e);
    }
  }, [formData]);

  // Load saved form data on component mount
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem('eventFormData');
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        setFormData(parsedForm);
        console.log('Loaded saved form data from local storage');
      }
    } catch (e) {
      console.error('Failed to load saved form data:', e);
    }
  }, []);

  // Extremely aggressive approach to prevent blocking
  const handleSubmit = useCallback(async (e) => {
    console.log('🚀 HANDLESUBMIT STARTED - Event validation clicked');
    
    try {
      e.preventDefault();
      setError(null);
      
      // Record start time to log total execution time
      const totalStartTime = performance.now();
      console.log('Event creation form submitted at', new Date().toISOString());
      console.log('Form data at submission:', JSON.stringify(formData, null, 2));
      console.log('User data at submission:', JSON.stringify(user, null, 2));
      
      // Validate form
      console.log('🔍 STEP 1: Form validation');
      const validation = validateForm();
      if (!validation.valid) {
        console.log('❌ Form validation failed:', validation.message);
        toast.error(validation.message);
        setError(validation.message);
        return;
      }

      console.log('✅ Form validation passed, proceeding with event creation');
    
    // Save form data to localStorage before proceeding
    saveFormToStorage();
    
    setLoading(true);
    toast.info('Création de l\'événement en cours...');

      // Prepare event data outside of try/catch for access in multiple places
      console.log('🔍 STEP 2: Preparing event data');
      
      // Validate user exists
      if (!user || !user.id) {
        console.error('❌ User not found or missing ID:', user);
        toast.error('Erreur: utilisateur non connecté');
        setError('Utilisateur non connecté');
        return;
      }
      
      const eventData = {
        title: formData.title,
        description: formData.description || ' ', // Ensure not null
        theme: formData.theme || '',
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate,
        userId: user.id,
        videoDuration: parseInt(formData.videoDuration, 10) || 60,
        maxClipDuration: parseInt(formData.maxClipDuration, 10) || 10
      };

      console.log('✅ Event data prepared:', JSON.stringify(eventData, null, 2));

      // Use a non-blocking pattern for event creation
      // This way, even if this fails, we won't block the UI
      console.log('🔍 STEP 3: Creating event promise');
      const createEventPromise = new Promise((resolve) => {
        // Wrap in setTimeout to ensure this doesn't block main thread
        setTimeout(async () => {
          try {
            console.log('🔍 STEP 4: Inside event creation promise');
            const startTime = performance.now();
            console.log('Starting actual event creation at', new Date().toISOString());
            
            console.log('🔍 STEP 5: Calling eventService.createEvent');
            const createdEvent = await eventService.createEvent(eventData);
          
          const createTime = performance.now() - startTime;
          console.log('Event created successfully:', createdEvent);
          console.log('Event ID:', createdEvent.id);
          console.log('Event creation time:', Math.round(createTime), 'ms');
          
          // Process participants without waiting
          try {
            if (formData.participants && formData.participants.length > 0) {
              // Store event ID in local storage for potential retry
              localStorage.setItem('lastCreatedEventId', createdEvent.id);
              
              const uniqueEmails = [...new Set(formData.participants.map(email => email.trim().toLowerCase()))];
              console.log(`Starting to process ${uniqueEmails.length} participants for event ${createdEvent.id}`);
              console.log('Event data for participants:', createdEvent);
              console.log('Participants emails:', uniqueEmails);
              
              // Send invitations in background without awaiting
              processParticipantsInBatches(createdEvent.id, uniqueEmails, createdEvent).catch(err => {
                console.error('Background participant processing error:', err);
                console.error('Error details:', JSON.stringify(err, null, 2));
              });
            }
          } catch (participantError) {
            console.error('Failed to start participant processing:', participantError);
            console.error('Participant error details:', JSON.stringify(participantError, null, 2));
            // Non-critical, continue
          }
          
          // Clear form data from storage on successful creation
          localStorage.removeItem('eventFormData');
          resolve({success: true, event: createdEvent});
        } catch (error) {
          console.error('❌ STEP ERROR: Event creation failed:', error);
          console.error('❌ Error type:', typeof error);
          console.error('❌ Error message:', error?.message);
          console.error('❌ Error stack:', error?.stack);
          resolve({success: false, error});
        }
      }, 0);
    });

      console.log('🔍 STEP 6: Awaiting event creation promise');
      const result = await createEventPromise;
      const totalTime = performance.now() - totalStartTime;
      console.log(`Total execution flow took ${Math.round(totalTime)}ms`);

      setLoading(false);

      if (result.success) {
        console.log('✅ Event creation successful');
        toast.success('Événement créé avec succès!');
        navigate('/dashboard');
      } else {
        console.error('❌ Event creation failed');
        const errorMsg = result.error?.message || result.error || 'Erreur lors de la création';
        console.error('Error message will be:', errorMsg);
        toast.error(`Erreur: ${errorMsg}`);
        setError(errorMsg);
      }

      
    } catch (handleSubmitError) {
      console.error('❌ CRITICAL ERROR in handleSubmit:', handleSubmitError);
      console.error('❌ HandleSubmit error type:', typeof handleSubmitError);
      console.error('❌ HandleSubmit error message:', handleSubmitError?.message);
      console.error('❌ HandleSubmit error stack:', handleSubmitError?.stack);
      setLoading(false);
      const errorMsg = handleSubmitError?.message || 'Erreur critique lors de la soumission';
      toast.error(`Erreur critique: ${errorMsg}`);
      setError(errorMsg);
    }
    
  }, [formData, user, validateForm, processParticipantsInBatches, navigate, saveFormToStorage]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Créer un nouvel événement
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Définissez votre événement et invitez des participants à soumettre des vidéos.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Informations sur l'événement
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ex: Anniversaire de Julie"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Décrivez votre événement et ce que vous attendez des participants..."
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                    Thème (optionnel)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="theme"
                      id="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ex: Souvenirs d'été"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    Date limite
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="videoDuration" className="block text-sm font-medium text-gray-700">
                    Durée du montage final (secondes)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="videoDuration"
                      id="videoDuration"
                      min="30"
                      max="300"
                      value={formData.videoDuration}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="maxClipDuration" className="block text-sm font-medium text-gray-700">
                    Durée max par clip (secondes)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="maxClipDuration"
                      id="maxClipDuration"
                      min="5"
                      max="30"
                      value={formData.maxClipDuration}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Participants
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex">
                <input
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Email du participant"
                />
                <Button
                  type="button"
                  onClick={handleAddParticipant}
                  className="ml-3"
                >
                  Ajouter
                </Button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Participants invités: <span className="font-bold">{formData.participants.length}</span>
                </h4>
                {formData.participants.length > 0 ? (
                  <ParticipantsList 
                    participants={formData.participants} 
                    onRemove={handleRemoveParticipant} 
                  />
                ) : (
                  <div className="text-sm text-gray-500 py-3 px-4 border border-gray-200 rounded-md">
                    Aucun participant ajouté
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 flex justify-between sm:px-6">
              {loading && (
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-60 bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs text-gray-500">Création en cours...</span>
                </div>
              )}
              <div className="flex space-x-3">
                {loading && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setLoading(false);
                      toast.info('Création annulée');
                    }}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  Créer l'événement
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateEventPage;