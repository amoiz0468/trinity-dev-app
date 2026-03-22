import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';
import { COLORS } from '../../constants';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('handles onPress event', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press Test" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Press Test'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('displays loading indicator and disables press when loading is true', () => {
    const onPressMock = jest.fn();
    const { getByRole, queryByText } = render(
      <Button title="Loading Button" loading={true} onPress={onPressMock} />
    );

    // The text should not be visible when loading
    expect(queryByText('Loading Button')).toBeNull();
    
    // The button must be disabled and busy
    const button = getByRole('button', { busy: true });
    expect(button).toBeTruthy();
    
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('disables press when disabled is true', () => {
    const onPressMock = jest.fn();
    const { getByText, getByRole } = render(
      <Button title="Disabled Button" disabled={true} onPress={onPressMock} />
    );
    
    const buttonNode = getByRole('button', { disabled: true });
    expect(buttonNode).toBeTruthy();
    
    fireEvent.press(getByText('Disabled Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders different visual variants correctly', () => {
    const { getByText, rerender } = render(
      <Button title="Primary" variant="primary" onPress={() => {}} />
    );
    // Ideally we would check styles, but testing-library/react-native styles check is complex
    // We just ensure it renders without crashing
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button title="Outline" variant="outline" onPress={() => {}} />);
    expect(getByText('Outline')).toBeTruthy();
    
    rerender(<Button title="Danger" variant="danger" onPress={() => {}} />);
    expect(getByText('Danger')).toBeTruthy();
  });
});
