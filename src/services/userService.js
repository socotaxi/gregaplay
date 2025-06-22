import supabase from '../lib/supabaseClient';

const userService = {
  /**
   * Upload a profile image to Supabase Storage
   * @param {File} file - image file selected by user
   * @param {string} userId - current user id
   * @returns {Promise<string>} public URL of uploaded image
   */
  async uploadAvatar(file, userId) {
    if (!file) throw new Error('No file provided');
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

export default userService;

