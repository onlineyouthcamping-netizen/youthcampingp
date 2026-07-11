/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../frontend/src/hooks/use-local-storage';
import { useDebounce } from '../../frontend/src/hooks/use-debounce';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []));
    
    act(() => {
      result.current[1](['item1', 'item2']);
    });

    expect(localStorage.getItem('test-key')).toBe(JSON.stringify(['item1', 'item2']));
  });

  it('should read from localStorage on mount', () => {
    localStorage.setItem('wishlist', JSON.stringify(['trip1', 'trip2']));
    
    const { result } = renderHook(() => useLocalStorage<string[]>('wishlist', []));
    expect(result.current[0]).toEqual(['trip1', 'trip2']);
  });

  it('should handle array manipulation', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('items', []));
    
    act(() => {
      result.current[1](['a', 'b']);
    });
    
    expect(result.current[0]).toEqual(['a', 'b']);
    
    act(() => {
      result.current[1]((prev: any) => [...prev, 'c']);
    });
    
    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });
});

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Change value
    rerender({ value: 'changed', delay: 300 });
    
    // Should still be initial value
    expect(result.current).toBe('initial');
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Now it should be changed
    expect(result.current).toBe('changed');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    rerender({ value: 'second', delay: 300 });
    act(() => jest.advanceTimersByTime(100)); // Before debounce completes
    
    rerender({ value: 'third', delay: 300 });
    act(() => jest.advanceTimersByTime(300));
    
    // Should be 'third', not 'second'
    expect(result.current).toBe('third');
  });

  it('should respect custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });
    act(() => jest.advanceTimersByTime(300)); // Less than delay
    
    expect(result.current).toBe('initial');
    
    act(() => jest.advanceTimersByTime(200)); // Now >= 500 total
    expect(result.current).toBe('updated');
  });
});
