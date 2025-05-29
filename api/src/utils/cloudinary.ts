import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config';

cloudinary.config({
  cloud_name: config.clodinary_cloud_name,
  api_key: config.cloudinary_key,
  api_secret: config.cloudinary_secret,
});

export async function handleUpload(file: string) {
  const res = await cloudinary.uploader.upload(file, {
    transformation: [
        { height: 1000, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
    ]
  });
  return res;
}