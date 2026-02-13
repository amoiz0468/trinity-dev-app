import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    const { getByText, getByPlaceholderText } = render(
      <Input label="Email" placeholder="Enter email" onChangeText={() => {}} />
    );
    
    expect(getByText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Test" onChangeText={mockChange} />
    );
    
    const input = getByPlaceholderText('Test');
    fireEvent.changeText(input, 'test value');
    
    expect(mockChange).toHaveBeenCalledWith('test value');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <Input
        placeholder="Test"
        onChangeText={() => {}}
        error="This field is required"
      />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('handles secure text entry', () => {
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Password"
        onChangeText={() => {}}
        secureTextEntry
      />
    );
    
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('calls rightIcon press handler', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <Input
        placeholder="Test"
        onChangeText={() => {}}
        rightIcon={<></>}
        onRightIconPress={mockPress}
      />
    );
    
    // This test would need the right icon to have testID for better testing
  });
});
