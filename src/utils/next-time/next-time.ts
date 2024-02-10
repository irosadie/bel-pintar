import moment from 'moment';

const getDayOfWeek = (day: string) => {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const dayIndex = days.findIndex(d => d === day.toLowerCase());
  return moment().day(dayIndex).format('dddd');
};

const nextTime = (bell: string) => {
  const [day, time] = bell.split(',').map(item => item.trim());
  const targetDay = getDayOfWeek(day);
  const now = moment();
  const targetTime = moment(`${targetDay} ${time}`, 'dddd HH:mm');
  if (targetTime.isSameOrAfter(now)) {
    return targetTime.valueOf();
  }
  return targetTime.add(7, 'days').valueOf();
};

export default nextTime;
