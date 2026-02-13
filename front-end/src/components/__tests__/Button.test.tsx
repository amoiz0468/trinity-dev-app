import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockPress} disabled />
    );
    
    const button = getByText('Test Button').parent?.parent;
    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Test Button" onPress={() => {}} loading />
    );
    
    expect(queryByText('Test Button')).toBeNull();
    expect(UNSAFE_getByType('ActivityIndicator')).toBeTruthy();
  });

  it('applies correct variant styles', () => {
    const { getByText, rerender } = render(
      <Button title="Test" onPress={() => {}} variant="primary" />
    );
    
    expect(getByText('Test')).toBeTruthy();
    
    rerender(<Button title="Test" onPress={() => {}} variant="secondary" />);
    expect(getByText('Test')).toBeTruthy();
    
    rerender(<Button title="Test" onPress={() => {}} variant="outline" />);
    expect(getByText('Test')).toBeTruthy();
  });
});
