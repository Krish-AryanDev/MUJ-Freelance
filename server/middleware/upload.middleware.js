import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import multer from 'multer';

import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../tmp/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_MIME_TYPES = [
	'application/pdf',
	'application/zip',
	'application/x-zip-compressed',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
];

const buildFileFilter = (allowedMimeTypes) => (req, file, cb) => {
	if (allowedMimeTypes.includes(file.mimetype)) {
		return cb(null, true);
	}

	return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
};

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		const extension = path.extname(file.originalname);
		const baseName = path
			.basename(file.originalname, extension)
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

		cb(null, `${Date.now()}-${baseName || 'upload'}${extension.toLowerCase()}`);
	},
});

const createUploader = ({ allowedMimeTypes, maxFileSize, maxFiles = 1 }) =>
	multer({
		storage,
		limits: {
			fileSize: maxFileSize,
			files: maxFiles,
		},
		fileFilter: buildFileFilter(allowedMimeTypes),
	});

const imageUpload = createUploader({
	allowedMimeTypes: IMAGE_MIME_TYPES,
	maxFileSize: 5 * 1024 * 1024,
	maxFiles: 6,
});

const documentUpload = createUploader({
	allowedMimeTypes: DOCUMENT_MIME_TYPES,
	maxFileSize: 20 * 1024 * 1024,
	maxFiles: 5,
});

const singleImageUpload = imageUpload.single('image');
const multipleImagesUpload = imageUpload.array('images', 6);
const singleDocumentUpload = documentUpload.single('file');
const multipleDocumentsUpload = documentUpload.array('files', 5);

export {
	DOCUMENT_MIME_TYPES,
	IMAGE_MIME_TYPES,
	createUploader,
	documentUpload,
	imageUpload,
	multipleDocumentsUpload,
	multipleImagesUpload,
	singleDocumentUpload,
	singleImageUpload,
	uploadDir,
};

export default imageUpload;

