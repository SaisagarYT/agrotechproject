// Authentication middleware (to be implemented later)

export const verifyFarmerId = (req, res, next) => {
  // To be implemented with JWT or session management
  // For now, allow requests through
  next();
};

export const validateApiKey = (req, res, next) => {
  // To be implemented if API key authentication is needed
  next();
};
