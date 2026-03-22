import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../Input';
import { Text } from 'react-native';

describe('Input Component', () => {
  it('renders label correctly', () => {
    const { getByText } = render(<Input label="Username" />);
    expect(getByText('Username')).toBeTruthy();
  });

  it('handles onChangeText event', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={onChangeTextMock} />
    );
    
    const textInput = getByPlaceholderText('Enter text');
    fireEvent.changeText(textInput, 'Hello World');
    
    expect(onChangeTextMock).toHaveBeenCalledWith('Hello World');
  });

  it('renders error message when error prop is passed', () => {
    const { getByText } = render(
      <Input placeholder="Password" error="Password is required" />
    );
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('renders icons properly', () => {
    const mockRightIconPress = jest.fn();
    
    const { getByTestId, UNSAFE_queryByType } = render(
      <Input 
        icon={<Text testID="left-icon">User</Text>}
        rightIcon={<Text testID="right-icon">Eye</Text>}
        onRightIconPress={mockRightIconPress}
      />
    );
    
    expect(getByTestId('left-icon')).toBeTruthy();
    expect(getByTestId('right-icon')).toBeTruthy();
    
    fireEvent.press(getByTestId('right-icon'));
    expect(mockRightIconPress).toHaveBeenCalledTimes(1);
  });

  it('manages focus states', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Focus me" />);
    const input = getByPlaceholderText('Focus me');
    
    // Trigger onFocus and onBlur without crashing
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
  });
});
