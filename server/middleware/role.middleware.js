import ApiError from '../utils/ApiError.js';

const requireRole = (...roles) => {
	return (req, _res, next) => {
		try {
			const user = req.user;

			if (!user) {
				throw new ApiError(401, 'Authentication required');
			}

			const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);

			const hasRole = roles.some((role) => userRoles.includes(role));

			if (!hasRole) {
				throw new ApiError(403, 'You are not authorized to access this resource');
			}

			next();
		} catch (error) {
			next(error);
		}
	};
};

const requireAdmin = requireRole('admin');
const requireFreelancer = requireRole('freelancer');
const requireClient = requireRole('client');

export { requireAdmin, requireClient, requireFreelancer, requireRole };
export default requireRole;

