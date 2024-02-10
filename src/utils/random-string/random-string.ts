const generateRandomString = () => {
  return `${Math.random().toString(36).slice(2, 20)}-${Math.floor(
    new Date().getTime() / 1000,
  )}`;
};

export default generateRandomString;
