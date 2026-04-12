import nodemailer from 'nodemailer';

import ApiError from './ApiError.js';

let transporter;

const getTransporter = () => {
	if (transporter) {
		return transporter;
	}

	const smtpHost = process.env.SMTP_HOST;
	const smtpPort = Number(process.env.SMTP_PORT || 587);
	const smtpUser = process.env.SMTP_USER;
	const smtpPass = process.env.SMTP_PASS;

	if (!smtpHost || !smtpUser || !smtpPass) {
		throw new ApiError(500, 'SMTP configuration is incomplete');
	}

	transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpPort === 465,
		auth: {
			user: smtpUser,
			pass: smtpPass,
		},
	});

	return transporter;
};

/**
 * Sends an email using configured SMTP credentials.
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
	if (!to || !subject || (!html && !text)) {
		throw new ApiError(400, 'Email payload must include to, subject, and html or text');
	}

	const mailFrom = from || process.env.SMTP_USER;

	try {
		const smtpTransporter = getTransporter();
		await smtpTransporter.sendMail({
			from: mailFrom,
			to,
			subject,
			html,
			text,
		});
	} catch (error) {
		throw new ApiError(500, 'Failed to send email', [error?.message || 'Unknown mailer error']);
	}
};

export { sendEmail };
export default sendEmail;

