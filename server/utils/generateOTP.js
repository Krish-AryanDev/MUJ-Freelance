import crypto from 'crypto';

/**
 * Generates numeric OTP of specified length.
 * Defaults to 6 digits for email verification.
 */
const generateOTP = (length = 6) => {
	if (!Number.isInteger(length) || length < 4 || length > 8) {
		throw new Error('OTP length must be an integer between 4 and 8');
	}

	const min = 10 ** (length - 1);
	const max = 10 ** length;
	const otp = crypto.randomInt(min, max);

	return String(otp);
};

export { generateOTP };
export default generateOTP;

