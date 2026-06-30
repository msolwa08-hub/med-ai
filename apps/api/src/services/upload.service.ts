// Run: npm install @aws-sdk/client-s3 in apps/api (if not already installed)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config.js';
import { randomBytes } from 'crypto';

const s3 = new S3Client({
  region: config.AWS_REGION ?? 'af-south-1',
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

/**
 * Upload a profile photo buffer to S3.
 * Returns the S3 object key (not the full URL).
 */
export async function uploadProfilePhoto(
  fileBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> {
  const key = `profile-photos/${userId}/${randomBytes(8).toString('hex')}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
    })
  );

  return key;
}

/**
 * Build the public HTTPS URL for a given S3 key.
 */
export function getProfilePhotoUrl(key: string): string {
  return `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION ?? 'af-south-1'}.amazonaws.com/${key}`;
}

/**
 * Delete a profile photo from S3 by key.
 */
export async function deleteProfilePhoto(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
    })
  );
}
