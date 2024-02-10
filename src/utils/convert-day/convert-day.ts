const convertDay = (key: string) => {
  return {
    senin: 'monday',
    selasa: 'tuesday',
    rabu: 'wednesday',
    kamis: 'thursday',
    jumat: 'friday',
    sabtu: 'saturday',
    minggu: 'sunday',
  }[key.toLowerCase()];
};

export default convertDay;
