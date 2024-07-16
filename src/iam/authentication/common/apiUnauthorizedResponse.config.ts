export const ApiUnauthorizedResponseConfig = {
  noAccessToken: {
    value: { message: 'Access token not found' },
  },
  expiredAccessToken: {
    value: { message: 'Access token expired' },
  },
};
