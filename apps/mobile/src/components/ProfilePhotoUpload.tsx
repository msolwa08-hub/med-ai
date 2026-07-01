// Run: npx expo install expo-image-picker in apps/mobile (if not already installed)
import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { apiClient } from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  displayName: string;   // used for initials fallback
  size?: number;         // circle diameter, default 100
  onUploadSuccess?: (url: string) => void;
}

interface UploadResponse {
  success: boolean;
  data: {
    key: string;
    url: string;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  displayName,
  size = 100,
  onUploadSuccess,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);

  const initials = displayName.trim().charAt(0).toUpperCase() || '?';
  const borderRadius = size / 2;
  const cameraSize = Math.round(size * 0.28);
  const cameraOffset = Math.round(size * 0.04);

  const handlePress = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library to upload a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'Could not read the selected image. Please try again.');
        return;
      }

      setUploading(true);

      const response = await apiClient.post<UploadResponse>('/upload/profile-photo', {
        imageBase64: asset.base64,
        mimeType: 'image/jpeg',
      });

      const { url } = response.data.data;
      setPhotoUrl(url);
      onUploadSuccess?.(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to upload photo. Please try again.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={uploading}
      style={[styles.wrapper, { width: size, height: size }]}
      accessibilityLabel="Change profile photo"
      accessibilityRole="button"
    >
      {/* Avatar or initials */}
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.initialsCircle,
            { width: size, height: size, borderRadius },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize: Math.round(size * 0.38) }]}>
            {initials}
          </Text>
        </View>
      )}

      {/* Loading overlay */}
      {uploading && (
        <View
          style={[
            styles.loadingOverlay,
            { width: size, height: size, borderRadius },
          ]}
        >
          <ActivityIndicator color={COLORS.white} size="small" />
        </View>
      )}

      {/* Camera badge */}
      {!uploading && (
        <View
          style={[
            styles.cameraBadge,
            {
              width: cameraSize,
              height: cameraSize,
              borderRadius: cameraSize / 2,
              bottom: cameraOffset,
              right: cameraOffset,
            },
          ]}
        >
          <Ionicons name="camera-outline" size={cameraSize * 0.55} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    backgroundColor: COLORS.systemGray5,
  },
  initialsCircle: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle white border so badge is visible on light photos
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default ProfilePhotoUpload;
