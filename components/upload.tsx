import * as FileSystem from "expo-file-system";
import { decode } from 'base64-arraybuffer'; // Assuming you have this or a similar package for decoding
import { supabase } from '../scripts/supabaseClient'; // Assuming you have Supabase client initialized

class ImageUploader {
  // Static method to upload the image and return the public URL
  static async uploadImage(uri: string | null): Promise<string | null> {
    if (!uri) {
      console.error("No image provided!");
      return null;
    }

    try {
      // Read the image file as a base64 string
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Extract the file extension from the URI
      const fileExt = uri.split('.').pop();
      console.log('extension', fileExt);
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Decode the base64 string to an ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images') // Change this to your bucket name (e.g., 'images')
        .upload(filePath, arrayBuffer, {
          upsert: true,
          contentType: 'image/*',
        });

      if (error) {
        console.error("Upload failed:", error.message);
        return null;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('images') // Use the same bucket name as above
        .getPublicUrl(filePath);

      console.log("Upload successful. Public URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error reading image or uploading:", error);
      return null;
    }
  }
}

export default ImageUploader;