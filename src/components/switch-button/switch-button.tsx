import React, { FC, useEffect, useState } from 'react';
import { Switch } from 'react-native';

export type SwitchButtonProps = {
  onToggle: (value: boolean) => void;
  selected: boolean;
};

const SwitchButton: FC<SwitchButtonProps> = ({ onToggle, selected }) => {
  const [isEnabled, setIsEnabled] = useState(selected);

  const handleToggleSwitch = (value: boolean) => {
    setIsEnabled(value);
    onToggle(value);
  };

  useEffect(() => {
    setIsEnabled(selected);
  }, [selected]);

  return (
    <Switch
      trackColor={{ true: '#FFDB4C', false: '#D9D9D9' }}
      thumbColor={isEnabled ? '#D9D9D9' : '#D9D9D9'}
      value={isEnabled}
      onValueChange={handleToggleSwitch}
    />
  );
};

export default SwitchButton;
