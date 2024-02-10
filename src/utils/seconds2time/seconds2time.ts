import moment from 'moment';

const seconds2TimeFormat = (seconds: number) => {
  const duration = moment.duration(seconds, 'seconds');
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const remainingSeconds = duration.seconds();

  const formattedTime = moment()
    .startOf('day')
    .add(hours, 'hours')
    .add(minutes, 'minutes')
    .add(remainingSeconds, 'seconds')
    .format(hours > 0 ? 'HH:mm:ss' : 'mm:ss');

  return formattedTime;
};

export default seconds2TimeFormat;
