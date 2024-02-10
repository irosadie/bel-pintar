const bytes2mb = (bytes: number) => {
  const mbSize: number = bytes / (1024 * 1024);
  return Math.round(mbSize);
};

export default bytes2mb;
