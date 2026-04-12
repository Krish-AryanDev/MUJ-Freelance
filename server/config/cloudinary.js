import { v2 as cloudinary } from 'cloudinary';

import ApiError from '../utils/ApiError.js';

const requiredCloudinaryEnv = [
	'CLOUDINARY_CLOUD_NAME',
	'CLOUDINARY_API_KEY',
	'CLOUDINARY_API_SECRET',
];

const validateCloudinaryEnv = () => {
	const missing = requiredCloudinaryEnv.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new ApiError(500, `Missing Cloudinary env variables: ${missing.join(', ')}`);
	}
};

const configureCloudinary = () => {
	validateCloudinaryEnv();

	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
		secure: true,
	});

	return cloudinary;
};

const uploadToCloudinary = async (filePath, folder) => {
	if (!filePath) {
		throw new ApiError(400, 'File path is required for Cloudinary upload');
	}

	try {
		const client = configureCloudinary();
		return await client.uploader.upload(filePath, {
			folder,
			resource_type: 'auto',
		});
	} catch (error) {
		throw new ApiError(500, 'Cloudinary upload failed', [error.message]);
	}
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
	if (!publicId) {
		throw new ApiError(400, 'Public ID is required for Cloudinary deletion');
	}

	try {
		const client = configureCloudinary();
		return await client.uploader.destroy(publicId, {
			resource_type: resourceType,
		});
	} catch (error) {
		throw new ApiError(500, 'Cloudinary deletion failed', [error.message]);
	}
};

export { cloudinary, configureCloudinary, deleteFromCloudinary, uploadToCloudinary };
export default configureCloudinary;

